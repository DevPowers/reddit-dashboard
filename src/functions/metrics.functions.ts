import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { subredditMetrics, subreddits } from "../db/schema";

export const getMetrics = createServerFn({ method: "GET" }).handler(
	async () => {
		// Join subreddits and subreddit_metrics to return a flat list of time-series data
		const data = await db
			.select({
				id: subredditMetrics.id,
				subredditId: subreddits.id,
				name: subreddits.name,
				category: subreddits.category,
				subCategory: subreddits.subCategory,
				arpuExpectation: subreddits.arpuExpectation,
				population: subreddits.population,
				weeklyVisitors: subredditMetrics.weeklyVisitors,
				weeklyContributions: subredditMetrics.weeklyContributions,
				recordedAt: subredditMetrics.recordedAt,
			})
			.from(subredditMetrics)
			.innerJoin(subreddits, eq(subredditMetrics.subredditId, subreddits.id));

		return data;
	},
);
