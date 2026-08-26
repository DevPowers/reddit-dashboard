import { db } from "../db/index.server";
import {
	metricsHistory,
	subreddits,
	platformHistoricalMetrics,
} from "../db/schema";
import { eq, gte, sql } from "drizzle-orm";

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
	for (const sub of latestData) {
		totalLatestReach += sub.weeklyVisitors;
	}

	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);

	// Calculate growth strictly against the first ever recorded macro snapshot (Genesis)
	const genesisMetrics = await db
		.select()
		.from(platformHistoricalMetrics)
		.orderBy(sql`${platformHistoricalMetrics.recordedAt} ASC`)
		.limit(1); 

	let overallGrowthPercent = 0;
	let overallNetNewReach = 0;

	if (genesisMetrics.length > 0) {
		const baseline = genesisMetrics[0];
		overallNetNewReach = totalLatestReach - baseline.totalWeeklyVisitors;
		overallGrowthPercent = baseline.totalWeeklyVisitors > 0 
			? (overallNetNewReach / baseline.totalWeeklyVisitors) * 100 
			: 0;
	}

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
