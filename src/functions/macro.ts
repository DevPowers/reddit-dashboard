import { db } from "../db/index.server";
import { Category } from "../types";
import {
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	platformHistoricalMetrics,
} from "../db/schema";
import { eq, gte, notInArray } from "drizzle-orm";
import {
	calculateSubVelocity,
	normalizeVelocityScore,
	findClosestToDate,
} from "../lib/calculations";

export const calculateAndSaveMacroMetrics = async () => {
	const data = await db
		.select({
			id: metricsHistory.id,
			subredditId: subreddits.id,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			weeklyContributions: metricsHistory.weeklyContributions,
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
		.where(notInArray(trackingGroups.category, [Category.PERSONAL_TRACKING, Category.SPORTS]));

	// Pre-dedupe overlapping subreddits that exist in multiple tracking groups (e.g. r/gaming)
	// For any given data point, we keep the one with the highest combined monetization rating
	const dedupedMap = new Map<string, typeof data[0]>();
	for (const row of data) {
		const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
		const existing = dedupedMap.get(key);

		if (!existing) {
			dedupedMap.set(key, row);
		}
	}
	const dedupedData = Array.from(dedupedMap.values());

	// Pre-group all data by subredditId for O(1) lookups
	const dataBySubreddit = new Map<number, typeof data>();
	for (const row of dedupedData) {
		if (!dataBySubreddit.has(row.subredditId)) {
			dataBySubreddit.set(row.subredditId, []);
		}
		dataBySubreddit.get(row.subredditId)!.push(row);
	}

	// Pre-sort all subreddit histories once
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

	// 2. Find baseline data — earliest record per subreddit
	// This is the simplest correct approach: baseline is always the earliest scrape we have.
	// Since all our data is post-quarter-close, this gives us "growth since we started tracking."
	const baselineMap = new Map<number, typeof data[0]>();
	for (const row of dedupedData) {
		const existing = baselineMap.get(row.subredditId);
		if (!existing || new Date(row.recordedAt) < new Date(existing.recordedAt)) {
			baselineMap.set(row.subredditId, row);
		}
	}

	// 3. Setup 28-day window target for velocity baseline
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() - 28);

	// 4. Aggregate
	let totalLatestReach = 0;
	let growthNumeratorLatestReach = 0;
	let growthDenominatorBaselineReach = 0;
	let totalLatestContributions = 0;
	let growthNumeratorLatestContributions = 0;
	let growthDenominatorBaselineContributions = 0;
	let totalWeightedVelocity = 0;
	let velocityContributorCount = 0;

	for (const sub of latestData) {
		const reach = sub.weeklyVisitors;
		const contributions = sub.weeklyContributions;
		totalLatestReach += reach;
		totalLatestContributions += contributions;

		const subHistory = dataBySubreddit.get(sub.subredditId) || [];
		const baseline = baselineMap.get(sub.subredditId);

		// "Same-Store" Logic: Only include in growth if the subreddit has data from
		// at least 2 DISTINCT DATES (not just 2 records which could be same-day duplicates).
		const distinctDates = new Set(
			subHistory.map((r) => new Date(r.recordedAt).toISOString().slice(0, 10))
		);

		if (distinctDates.size >= 2 && baseline) {
			const baselineReach = baseline.weeklyVisitors;
			const baselineContributions = baseline.weeklyContributions;
			growthDenominatorBaselineReach += baselineReach;
			growthNumeratorLatestReach += reach;
			growthDenominatorBaselineContributions += baselineContributions;
			growthNumeratorLatestContributions += contributions;

			// Velocity calculation uses 28-day window
			const baselinePoint = findClosestToDate(subHistory, targetDate);
			const baselineWau = baselinePoint ? baselinePoint.weeklyVisitors : sub.weeklyVisitors;

			if (baselinePoint && new Date(baselinePoint.recordedAt).toISOString().slice(0, 10) !== new Date(sub.recordedAt).toISOString().slice(0, 10)) {
				const velocity = calculateSubVelocity(
					sub.weeklyVisitors,
					baselineWau,
				);
				totalWeightedVelocity += velocity;
				velocityContributorCount++;
			}
		}
	}

	const overallGrowthPercent =
		growthDenominatorBaselineReach > 0
			? ((growthNumeratorLatestReach - growthDenominatorBaselineReach) / growthDenominatorBaselineReach) * 100
			: 0;
	const overallNetNewReach = growthNumeratorLatestReach - growthDenominatorBaselineReach;

	const overallContributionGrowthPercent =
		growthDenominatorBaselineContributions > 0
			? ((growthNumeratorLatestContributions - growthDenominatorBaselineContributions) / growthDenominatorBaselineContributions) * 100
			: 0;
	const overallNetNewContributions = growthNumeratorLatestContributions - growthDenominatorBaselineContributions;

	// Dynamic normalization instead of magic /100000 constant
	const averageCommunityGrowth = normalizeVelocityScore(
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
				totalWeeklyVisitors: totalLatestReach,
				visitorGrowthPercent: overallGrowthPercent,
				netNewWeeklyVisitors: overallNetNewReach,
				totalWeeklyContributions: totalLatestContributions,
				contributionGrowthPercent: overallContributionGrowthPercent,
				netNewWeeklyContributions: overallNetNewContributions,
				averageCommunityGrowth: averageCommunityGrowth,
			})
			.where(eq(platformHistoricalMetrics.id, existingToday[0].id))
			.returning();
		return updated;
	}

	const [inserted] = await db
		.insert(platformHistoricalMetrics)
		.values({
			totalWeeklyVisitors: totalLatestReach,
			visitorGrowthPercent: overallGrowthPercent,
			netNewWeeklyVisitors: overallNetNewReach,
			totalWeeklyContributions: totalLatestContributions,
			contributionGrowthPercent: overallContributionGrowthPercent,
			netNewWeeklyContributions: overallNetNewContributions,
			averageCommunityGrowth: averageCommunityGrowth,
		})
		.returning();

	return inserted;
};
