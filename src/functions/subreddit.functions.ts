import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.server";
import { metricsHistory, subreddits, cronSubredditLogs } from "../db/schema";

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

		const rawLogs = await db
			.select({
				id: cronSubredditLogs.id,
				status: cronSubredditLogs.status,
				errorMessage: cronSubredditLogs.errorMessage,
				httpCode: cronSubredditLogs.httpCode,
				usedPremium: cronSubredditLogs.usedPremium,
				durationMs: cronSubredditLogs.durationMs,
				ranAt: cronSubredditLogs.ranAt,
			})
			.from(cronSubredditLogs)
			.innerJoin(subreddits, eq(cronSubredditLogs.subredditId, subreddits.id))
			.where(eq(subreddits.name, subredditName))
			.orderBy(desc(cronSubredditLogs.ranAt))
			.limit(50); // Get enough recent history to find failures + 1 success

		// Filter for failures and only the SINGLE most recent success
		const filteredLogs: typeof rawLogs = [];
		let foundSuccess = false;
		
		for (const log of rawLogs) {
			if (log.status === "failed") {
				filteredLogs.push(log);
			} else if (log.status === "success" && !foundSuccess) {
				filteredLogs.push(log);
				foundSuccess = true;
			}
		}

		return {
			subredditName,
			metrics,
			logs: filteredLogs,
		};
	});
