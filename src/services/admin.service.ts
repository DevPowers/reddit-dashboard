import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.server";
import { cronLogs, platformHistoricalMetrics } from "../db/schema";

export const getAdminStats = async () => {
	// 1. DB Health Check
	let dbHealth = "Healthy";
	try {
		await db.execute(sql`SELECT 1`);
	} catch (e) {
		dbHealth = "Unreachable";
	}

	// 2. Cron Stats (Days of Data)
	const totalDays = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(platformHistoricalMetrics);
		
	const recentCrons = await db
		.select()
		.from(cronLogs)
		.orderBy(desc(cronLogs.ranAt))
		.limit(1);

	const avgDurationResult = await db
		.select({ avg: sql<number>`avg(${cronLogs.durationMs})::int` })
		.from(cronLogs)
		.where(eq(cronLogs.status, "success"));

	return {
		cronStats: {
			totalRuns: totalDays[0]?.count || 0,
			recentRun: recentCrons[0] || null,
			avgDurationMs: avgDurationResult[0]?.avg || null,
		},
		dbHealth,
	};
};
