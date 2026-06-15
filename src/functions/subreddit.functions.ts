import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.server";
import { metricsHistory, subreddits } from "../db/schema";

export const getSubredditMetrics = createServerFn({ method: "GET" })
	.validator((subredditName: string) => subredditName)
	.handler(async ({ data: subredditName }) => {
		const metrics = await db
			.select({
				id: metricsHistory.id,
				weeklyVisitors: metricsHistory.weeklyVisitors,
				weeklyContributions: metricsHistory.weeklyContributions,
				recordedAt: metricsHistory.recordedAt,
			})
			.from(metricsHistory)
			.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
			.where(eq(subreddits.name, subredditName))
			.orderBy(desc(metricsHistory.recordedAt));

		return {
			subredditName,
			metrics,
		};
	});
