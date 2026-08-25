import { db } from "../db/index.server";
import {
	metricsHistory,
	subreddits,
	platformHistoricalMetrics,
} from "../db/schema";
import { eq, gte } from "drizzle-orm";

export const calculateAndSaveMacroMetrics = async () => {
	const data = await db
		.select({
			id: metricsHistory.id,
			subredditId: subreddits.id,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			recordedAt: metricsHistory.recordedAt,
		})
		.from(metricsHistory)
		.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
		.where(eq(subreddits.isActive, true)); // Only calculate on currently tracked top 250

	// Pre-dedupe overlapping data if any
	const dedupedMap = new Map<string, typeof data[0]>();
	for (const row of data) {
		const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
		const existing = dedupedMap.get(key);
		if (!existing) {
			dedupedMap.set(key, row);
		}
	}
	const dedupedData = Array.from(dedupedMap.values());

	// Pre-group all data by subredditId
	const dataBySubreddit = new Map<number, typeof data>();
	for (const row of dedupedData) {
		if (!dataBySubreddit.has(row.subredditId)) {
			dataBySubreddit.set(row.subredditId, []);
		}
		dataBySubreddit.get(row.subredditId)!.push(row);
	}

	for (const history of dataBySubreddit.values()) {
		history.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
	}

	const latestMap = new Map<number, typeof data[0]>();
	for (const row of dedupedData) {
		const existing = latestMap.get(row.subredditId);
		if (!existing || new Date(row.recordedAt) > new Date(existing.recordedAt)) {
			latestMap.set(row.subredditId, row);
		}
	}
	const latestData = Array.from(latestMap.values());

	const baselineMap = new Map<number, typeof data[0]>();
	for (const row of dedupedData) {
		const existing = baselineMap.get(row.subredditId);
		if (!existing || new Date(row.recordedAt) < new Date(existing.recordedAt)) {
			baselineMap.set(row.subredditId, row);
		}
	}

	let totalLatestReach = 0;
	let growthNumeratorLatestReach = 0;
	let growthDenominatorBaselineReach = 0;

	for (const sub of latestData) {
		const reach = sub.weeklyVisitors;
		totalLatestReach += reach;

		const subHistory = dataBySubreddit.get(sub.subredditId) || [];
		const baseline = baselineMap.get(sub.subredditId);

		const distinctDates = new Set(
			subHistory.map((r) => new Date(r.recordedAt).toISOString().slice(0, 10))
		);

		if (distinctDates.size >= 2 && baseline) {
			const baselineReach = baseline.weeklyVisitors;
			growthDenominatorBaselineReach += baselineReach;
			growthNumeratorLatestReach += reach;
		}
	}

	const overallGrowthPercent =
		growthDenominatorBaselineReach > 0
			? ((growthNumeratorLatestReach - growthDenominatorBaselineReach) / growthDenominatorBaselineReach) * 100
			: 0;
	const overallNetNewReach = growthNumeratorLatestReach - growthDenominatorBaselineReach;

	// --- Statistical Metrics ---
	const sortedLatest = [...latestData].sort((a, b) => a.weeklyVisitors - b.weeklyVisitors);
	const numSubreddits = sortedLatest.length;
	
	let medianVisitors = 0;
	let minVisitors = 0;
	let maxVisitors = 0;
	let averageVisitors = 0;
	let top10Concentration = 0;

	if (numSubreddits > 0) {
		minVisitors = sortedLatest[0].weeklyVisitors;
		maxVisitors = sortedLatest[numSubreddits - 1].weeklyVisitors;
		averageVisitors = Math.round(totalLatestReach / numSubreddits);

		const mid = Math.floor(numSubreddits / 2);
		medianVisitors = numSubreddits % 2 !== 0 
			? sortedLatest[mid].weeklyVisitors 
			: Math.round((sortedLatest[mid - 1].weeklyVisitors + sortedLatest[mid].weeklyVisitors) / 2);

		// Top 10 Concentration
		const top10Sum = sortedLatest
			.slice(-10) // get the 10 largest
			.reduce((sum, sub) => sum + sub.weeklyVisitors, 0);
		top10Concentration = totalLatestReach > 0 ? (top10Sum / totalLatestReach) * 100 : 0;
	}
	// ---------------------------

	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);

	const existingToday = await db
		.select()
		.from(platformHistoricalMetrics)
		.where(gte(platformHistoricalMetrics.recordedAt, todayStart))
		.limit(1);

	const metricsPayload = {
		totalWeeklyVisitors: totalLatestReach,
		visitorGrowthPercent: overallGrowthPercent,
		netNewWeeklyVisitors: overallNetNewReach,
		medianVisitors,
		minVisitors,
		maxVisitors,
		averageVisitors,
		top10Concentration,
	};

	if (existingToday.length > 0) {
		const [updated] = await db
			.update(platformHistoricalMetrics)
			.set(metricsPayload)
			.where(eq(platformHistoricalMetrics.id, existingToday[0].id))
			.returning();
		return updated;
	}

	const [inserted] = await db
		.insert(platformHistoricalMetrics)
		.values(metricsPayload)
		.returning();

	return inserted;
};
