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
		})
		.returning();

	return inserted;
};
