import { createServerFn } from "@tanstack/react-start";
import { eq, asc, sql } from "drizzle-orm";
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
