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
        WITH latest_metrics AS (
            SELECT DISTINCT ON (subreddit_id)
                subreddit_id,
                weekly_visitors,
                weekly_contributions
            FROM metrics_history
            ORDER BY subreddit_id, recorded_at DESC
        )
        SELECT 
            s.id, 
            s.name, 
            COALESCE(STRING_AGG(DISTINCT tg.category, ', '), 'Uncategorized') as category,
            CAST(COUNT(DISTINCT m.id) AS INTEGER) as data_points, 
            MAX(m.recorded_at) as last_updated,
            lm.weekly_visitors as latest_visitors,
            lm.weekly_contributions as latest_contributions
        FROM subreddits s
        LEFT JOIN metrics_history m ON s.id = m.subreddit_id
        LEFT JOIN subreddit_groups sg ON s.id = sg.subreddit_id
        LEFT JOIN tracking_groups tg ON sg.group_id = tg.id
        LEFT JOIN latest_metrics lm ON s.id = lm.subreddit_id
        GROUP BY s.id, s.name, lm.weekly_visitors, lm.weekly_contributions
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
