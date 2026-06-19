import { db } from "../db/index.server";
import { Category } from "../types";
import {
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	platformHistoricalMetrics,
} from "../db/schema";
import { eq, ne, gte } from "drizzle-orm";
import {
	getQuarterEndBaseline,
	calculateSubVelocity,
	normalizeVelocityScore,
	findClosestToDate,
} from "../lib/calculations";

export const calculateAndSaveMacroMetrics = async () => {
	const data = await db
		.select({
			id: metricsHistory.id,
			subredditId: subreddits.id,
			monetizationWeight: trackingGroups.monetizationWeight,
			arpuMultiplier: trackingGroups.arpuMultiplier,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			recordedAt: metricsHistory.recordedAt,
		})
		.from(metricsHistory)
		.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
		.innerJoin(
			subredditGroups,
			eq(subreddits.id, subredditGroups.subredditId),
		)
		.innerJoin(
			trackingGroups,
			eq(subredditGroups.groupId, trackingGroups.id),
		)
		.where(ne(trackingGroups.category, Category.PERSONAL_TRACKING));

	// Pre-dedupe overlapping subreddits that exist in multiple tracking groups (e.g. r/gaming)
	// For any given data point, we keep the one with the highest combined monetization rating
	const dedupedMap = new Map<string, typeof data[0]>();
	for (const row of data) {
		const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
		const existing = dedupedMap.get(key);

		if (!existing) {
			dedupedMap.set(key, row);
		} else {
			const rowRating = row.monetizationWeight * row.arpuMultiplier;
			const existingRating = existing.monetizationWeight * existing.arpuMultiplier;
			if (rowRating > existingRating) {
				dedupedMap.set(key, row);
			}
		}
	}
	const dedupedData = Array.from(dedupedMap.values());

	// Pre-group all data by subredditId for O(1) lookups (fixes O(N²) filter/sort inside loop)
	const dataBySubreddit = new Map<number, typeof data>();
	for (const row of dedupedData) {
		if (!dataBySubreddit.has(row.subredditId)) {
			dataBySubreddit.set(row.subredditId, []);
		}
		dataBySubreddit.get(row.subredditId)!.push(row);
	}

	// Pre-sort all subreddit histories once (fixes O(N log N) inside the loop)
	for (const history of dataBySubreddit.values()) {
		history.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
	}

	// 1. Find the latest data point per subreddit
	const latestMap = new Map<number, typeof data[0]>();
	for (const row of dedupedData) {
		const existing = latestMap.get(row.subredditId);
		if (!existing || new Date(row.recordedAt) > new Date(existing.recordedAt)) {
			latestMap.set(row.subredditId, row);
		}
	}
	const latestData = Array.from(latestMap.values());

	// 1.5. Find historical baseline data using shared quarter-end calculation
	const T0_DATE = getQuarterEndBaseline(new Date());
	const historicalMap = new Map<number, typeof data[0]>();

	for (const row of dedupedData) {
		const recordedAtDate = new Date(row.recordedAt);
		if (recordedAtDate <= T0_DATE) {
			const currentHistorical = historicalMap.get(row.subredditId);
			if (
				!currentHistorical ||
				recordedAtDate > new Date(currentHistorical.recordedAt)
			) {
				historicalMap.set(row.subredditId, row);
			}
		}
	}

	// Fallback: if no data before T0 for a subreddit, use its earliest record
	const earliestPerSub = new Map<number, typeof data[0]>();
	for (const row of dedupedData) {
		const currentEarliest = earliestPerSub.get(row.subredditId);
		if (
			!currentEarliest ||
			new Date(row.recordedAt) < new Date(currentEarliest.recordedAt)
		) {
			earliestPerSub.set(row.subredditId, row);
		}
	}
	
	for (const sub of latestData) {
		if (!historicalMap.has(sub.subredditId)) {
			const earliest = earliestPerSub.get(sub.subredditId);
			if (earliest) {
				historicalMap.set(sub.subredditId, earliest);
			}
		}
	}

	// 2. Setup 28-day window target for velocity baseline
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() - 28);

	// 3. Aggregate
	let totalLatestReach = 0; // The absolute reach index
	let growthNumeratorLatestReach = 0;
	let growthDenominatorHistoricalReach = 0;
	let totalWeightedVelocity = 0;
	let velocityContributorCount = 0;

	for (const sub of latestData) {
		const reach = sub.weeklyVisitors;
		totalLatestReach += reach;

		const subHistory = dataBySubreddit.get(sub.subredditId) || [];

		// "Same-Store" Metric Logic:
		// Only factor subreddits into Growth and Velocity if they have multiple data points to compare.
		// Otherwise, adding new subreddits dilutes the growth percentages heavily towards 0.
		if (subHistory.length >= 2) {
			const hist = historicalMap.get(sub.subredditId);
			if (hist && hist.id !== sub.id) {
				const histReach = hist.weeklyVisitors;
				growthDenominatorHistoricalReach += histReach;
				growthNumeratorLatestReach += reach;
			}

			const baselinePoint = findClosestToDate(subHistory, targetDate);
			const baselineWau = baselinePoint ? baselinePoint.weeklyVisitors : sub.weeklyVisitors;

			if (baselinePoint && baselinePoint.id !== sub.id) {
				const velocity = calculateSubVelocity(
					sub.weeklyVisitors,
					baselineWau,
					sub.arpuMultiplier,
					sub.monetizationWeight,
				);
				totalWeightedVelocity += velocity;
				velocityContributorCount++;
			}
		}
	}

	const overallGrowthPercent =
		growthDenominatorHistoricalReach > 0
			? ((growthNumeratorLatestReach - growthDenominatorHistoricalReach) / growthDenominatorHistoricalReach) * 100
			: 0;
	const overallNetNewReach = growthNumeratorLatestReach - growthDenominatorHistoricalReach;

	// Dynamic normalization instead of magic /100000 constant
	const velocityIndexScore = normalizeVelocityScore(
		totalWeightedVelocity,
		velocityContributorCount,
	);

	// Prevent duplicate macro metrics for the same day
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);

	const existingToday = await db
		.select()
		.from(platformHistoricalMetrics)
		.where(gte(platformHistoricalMetrics.recordedAt, todayStart))
		.limit(1);

	if (existingToday.length > 0) {
		const [updated] = await db
			.update(platformHistoricalMetrics)
			.set({
				overallDauEstimate: totalLatestReach,
				overallDauGrowthPercent: overallGrowthPercent,
				overallNetNewDau: overallNetNewReach,
				velocityIndexScore: velocityIndexScore,
			})
			.where(eq(platformHistoricalMetrics.id, existingToday[0].id))
			.returning();
		return updated;
	}

	const [inserted] = await db
		.insert(platformHistoricalMetrics)
		.values({
			overallDauEstimate: totalLatestReach,
			overallDauGrowthPercent: overallGrowthPercent,
			overallNetNewDau: overallNetNewReach,
			velocityIndexScore: velocityIndexScore,
		})
		.returning();

	return inserted;
};
