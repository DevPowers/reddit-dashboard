import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import { cronLogs } from "../db/schema";

export const getAdminStats = async () => {
	// 1. Cron Stats
	const totalCrons = await db
		.select({ count: sql<number>`count(*)` })
		.from(cronLogs);
	const lastCron = await db
		.select()
		.from(cronLogs)
		.orderBy(desc(cronLogs.ranAt))
		.limit(1);

	const avgDurationResult = await db
		.select({ avg: sql<number>`avg(${cronLogs.durationMs})` })
		.from(cronLogs)
		.where(eq(cronLogs.status, "success"));

	// 2. Subreddit Stats
	const subStats = await db.execute(sql`
        SELECT 
            s.id, 
            s.name, 
            COALESCE(STRING_AGG(DISTINCT tg.category, ', '), 'Uncategorized') as category,
            CAST(COUNT(DISTINCT m.id) AS INTEGER) as data_points, 
            MAX(m.recorded_at) as last_updated
        FROM subreddits s
        LEFT JOIN metrics_history m ON s.id = m.subreddit_id
        LEFT JOIN subreddit_groups sg ON s.id = sg.subreddit_id
        LEFT JOIN tracking_groups tg ON sg.group_id = tg.id
        GROUP BY s.id, s.name
        ORDER BY data_points DESC
    `);

	// 3. DB Health Check
	let dbHealth = "Healthy";
	try {
		await db.execute(sql`SELECT 1`);
	} catch (e) {
		dbHealth = "Unreachable";
	}

	return {
		cronStats: {
			totalRuns: totalCrons[0]?.count || 0,
			lastRun: lastCron[0] || null,
			avgDurationMs: avgDurationResult[0]?.avg || null,
		},
		subreddits: subStats as any[],
		dbHealth,
	};
};
