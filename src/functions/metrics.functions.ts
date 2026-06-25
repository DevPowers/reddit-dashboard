import { createServerFn } from "@tanstack/react-start";
import { eq, asc, notInArray } from "drizzle-orm";
import { db } from "../db/index.server";
import { Category } from "../types";
import {
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	platformHistoricalMetrics,
} from "../db/schema";

export const getMetrics = createServerFn({ method: "GET" }).handler(
	async () => {
		// Join subreddits and subreddit_metrics to return a flat list of time-series data
		const data = await db
			.select({
				id: metricsHistory.id,
				subredditId: subreddits.id,
				name: subreddits.name,
				category: trackingGroups.category,
				subCategory: trackingGroups.subCategory,
				population: trackingGroups.population,
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

		return data;
	},
);



export const getPlatformHistory = createServerFn({ method: "GET" }).handler(
	async () => {
		const history = await db
			.select()
			.from(platformHistoricalMetrics)
			.orderBy(asc(platformHistoricalMetrics.recordedAt));
		return history;
	},
);
