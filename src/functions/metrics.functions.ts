import { createServerFn } from "@tanstack/react-start";
import { eq, asc, desc, sql, and, gt } from "drizzle-orm";
import { db } from "../db/index.server";
import {
	metricsHistory,
	subreddits,
	platformHistoricalMetrics,
} from "../db/schema";

export const getMetrics = createServerFn({ method: "GET" }).handler(
	async () => {
		// Join subreddits and metricsHistory to return a flat list of time-series data
		const data = await db
			.select({
				id: metricsHistory.id,
				subredditId: subreddits.id,
				name: subreddits.name,
				isActive: subreddits.isActive,
				weeklyVisitors: metricsHistory.weeklyVisitors,
				recordedAt: metricsHistory.recordedAt,
			})
			.from(metricsHistory)
			.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id));

		return data;
	},
);

export const getPlatformHistory = createServerFn({ method: "GET" }).handler(
	async () => {
		const [latestScrape] = await db
			.select({ maxRecordedAt: sql<string>`max(${metricsHistory.recordedAt})` })
			.from(metricsHistory);

		const [latestMacro] = await db
			.select({ maxRecordedAt: sql<string>`max(${platformHistoricalMetrics.recordedAt})` })
			.from(platformHistoricalMetrics);

		const latestScrapeTime = latestScrape?.maxRecordedAt ? new Date(latestScrape.maxRecordedAt).getTime() : 0;
		const latestMacroTime = latestMacro?.maxRecordedAt ? new Date(latestMacro.maxRecordedAt).getTime() : 0;

		if (latestScrapeTime > latestMacroTime || latestMacroTime === 0) {
			const { calculateAndSaveMacroMetrics } = await import("./macro");
			try {
				await calculateAndSaveMacroMetrics();
			} catch (e) {
				console.error("Failed to calculate macro metrics via UI staleness check:", e);
			}
		}

		const history = await db
			.select()
			.from(platformHistoricalMetrics)
			.orderBy(asc(platformHistoricalMetrics.recordedAt));

		return history;
	},
);

export const getPortfolioChanges = createServerFn({ method: "GET" }).handler(
	async () => {
		// 1. Establish Genesis Date
		const earliestSub = await db
			.select()
			.from(subreddits)
			.orderBy(asc(subreddits.createdAt))
			.limit(1);

		if (!earliestSub[0]) return { additions: [], drops: [] };

		const genesisDate = new Date(earliestSub[0].createdAt);
		genesisDate.setHours(genesisDate.getHours() + 48); // 48 hours buffer

		// 2. Fetch Recent Additions (isActive = true, createdAt > genesisDate)
		const additions = await db
			.select({
				id: subreddits.id,
				name: subreddits.name,
				createdAt: subreddits.createdAt,
				visitors: metricsHistory.weeklyVisitors,
			})
			.from(subreddits)
			.leftJoin(
				metricsHistory,
				sql`${metricsHistory.id} = (
					SELECT id FROM metrics_history 
					WHERE subreddit_id = ${subreddits.id} 
					ORDER BY recorded_at DESC LIMIT 1
				)`
			)
			.where(and(eq(subreddits.isActive, true), gt(subreddits.createdAt, genesisDate)))
			.orderBy(desc(subreddits.createdAt))
			.limit(10);

		// 3. Fetch Recent Drops (isActive = false)
		const drops = await db
			.select({
				id: subreddits.id,
				name: subreddits.name,
				createdAt: subreddits.createdAt,
				lastSeenAt: subreddits.lastSeenAt,
				visitors: metricsHistory.weeklyVisitors,
			})
			.from(subreddits)
			.leftJoin(
				metricsHistory,
				sql`${metricsHistory.id} = (
					SELECT id FROM metrics_history 
					WHERE subreddit_id = ${subreddits.id} 
					ORDER BY recorded_at DESC LIMIT 1
				)`
			)
			.where(eq(subreddits.isActive, false))
			.orderBy(desc(subreddits.lastSeenAt))
			.limit(10);

		return { additions, drops };
	}
);
