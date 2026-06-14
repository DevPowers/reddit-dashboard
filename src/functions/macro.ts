import { db } from "../db/index";
import { Category } from "../types";
import {
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	platformHistoricalMetrics,
} from "../db/schema";
import { eq, ne } from "drizzle-orm";

export const calculateAndSaveMacroMetrics = async () => {
	const data = await db
		.select({
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

	// 1. Group by Subreddit to find the latest data
	const latestMap = new Map<number, typeof data[0]>();
	for (const row of data) {
		const existing = latestMap.get(row.subredditId);
		if (!existing || new Date(row.recordedAt) > new Date(existing.recordedAt)) {
			latestMap.set(row.subredditId, row);
		}
	}
	const latestData = Array.from(latestMap.values());

	// 1.5. Find historical baseline data
	const historicalMap = new Map<number, typeof data[0]>();
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth(); // 0-11
	
	let T0_DATE: Date;
	if (month >= 3 && month < 6) T0_DATE = new Date(`${year}-03-31T00:00:00Z`);
	else if (month >= 6 && month < 9) T0_DATE = new Date(`${year}-06-30T00:00:00Z`);
	else if (month >= 9 && month < 12) T0_DATE = new Date(`${year}-09-30T00:00:00Z`);
	else T0_DATE = new Date(`${year - 1}-12-31T00:00:00Z`);

	for (const row of data) {
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

	if (historicalMap.size === 0 && data.length > 0) {
		const earliestPerSub = new Map<number, typeof data[0]>();
		for (const row of data) {
			const currentEarliest = earliestPerSub.get(row.subredditId);
			if (
				!currentEarliest ||
				new Date(row.recordedAt) < new Date(currentEarliest.recordedAt)
			) {
				earliestPerSub.set(row.subredditId, row);
			}
		}
		for (const [subId, row] of earliestPerSub.entries()) {
			historicalMap.set(subId, row);
		}
	}
	const historicalData = Array.from(historicalMap.values());

	// 2. Setup 28-day window target
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() - 28);
	const targetTime = targetDate.getTime();

	// 3. Aggregate
	let totalLatestDau = 0;
	let totalHistoricalDau = 0;
	let totalWeightedVelocity = 0;

	for (const sub of latestData) {
		const estDau = Math.floor(sub.weeklyVisitors / 7);
		totalLatestDau += estDau;

		const hist = historicalData.find((h) => h.subredditId === sub.subredditId);
		let histDau = 0;
		if (hist) {
			histDau = Math.floor(hist.weeklyVisitors / 7);
			totalHistoricalDau += histDau;
		}

		const subHistory = data
			.filter((d) => d.subredditId === sub.subredditId)
			.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

		let baselineWau = sub.weeklyVisitors;
		if (subHistory.length > 0) {
			let bestMatch = subHistory[0];
			let smallestDiff = Math.abs(new Date(bestMatch.recordedAt).getTime() - targetTime);

			for (const point of subHistory) {
				const diff = Math.abs(new Date(point.recordedAt).getTime() - targetTime);
				if (diff < smallestDiff) {
					smallestDiff = diff;
					bestMatch = point;
				}
			}
			baselineWau = bestMatch.weeklyVisitors;
		}

		const velocity = (sub.weeklyVisitors - baselineWau) * sub.arpuMultiplier * sub.monetizationWeight;
		totalWeightedVelocity += velocity;
	}

	const overallGrowthPercent =
		totalHistoricalDau > 0
			? ((totalLatestDau - totalHistoricalDau) / totalHistoricalDau) * 100
			: 0;
	const overallNetNewDau = totalLatestDau - totalHistoricalDau;

	const rawVelocityIndexScore = totalWeightedVelocity / 100000;
	const velocityIndexScore = Math.max(-10, Math.min(10, rawVelocityIndexScore));

	const [inserted] = await db
		.insert(platformHistoricalMetrics)
		.values({
			overallDauEstimate: totalLatestDau,
			overallDauGrowthPercent: overallGrowthPercent,
			overallNetNewDau: overallNetNewDau,
			velocityIndexScore: velocityIndexScore,
		})
		.returning();

	return inserted;
};
