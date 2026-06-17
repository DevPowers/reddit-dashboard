import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.server";
import { cronLogs } from "../db/schema";
import { TARGET_SUBREDDITS } from "../data/subreddits";

export const getAdminStats = async () => {
	// 1. DB Health Check
	let dbHealth = "Healthy";
	try {
		await db.execute(sql`SELECT 1`);
	} catch (e) {
		dbHealth = "Unreachable";
	}

	// 2. Cron Stats
	const totalCrons = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(cronLogs);
	const lastCron = await db
		.select()
		.from(cronLogs)
		.orderBy(desc(cronLogs.ranAt))
		.limit(1);

	const avgDurationResult = await db
		.select({ avg: sql<number>`avg(${cronLogs.durationMs})::int` })
		.from(cronLogs)
		.where(eq(cronLogs.status, "success"));

	// 3. Subreddit Stats from DB
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
            s.name, 
            CAST(COUNT(DISTINCT m.id) AS INTEGER) as data_points, 
            MAX(m.recorded_at) as last_updated,
            lm.weekly_visitors as latest_visitors,
            lm.weekly_contributions as latest_contributions
        FROM subreddits s
        LEFT JOIN metrics_history m ON s.id = m.subreddit_id
        LEFT JOIN latest_metrics lm ON s.id = lm.subreddit_id
        GROUP BY s.id, s.name, lm.weekly_visitors, lm.weekly_contributions
    `);

	// 4. Merge Static Source of Truth with DB Stats
	const dbStatsMap = new Map(subStats.map((s: any) => [s.name, s]));
	
	const mergedSubreddits: any[] = [];
	for (const group of TARGET_SUBREDDITS) {
		for (const subName of group.subreddits) {
			// Avoid duplicates if a subreddit is in multiple groups
			if (mergedSubreddits.some(s => s.name === subName)) continue;

			const dbStat = dbStatsMap.get(subName);
			mergedSubreddits.push({
				id: dbStat?.id || Math.random(), // React key fallback
				name: subName,
				category: group.category,
				data_points: dbStat?.data_points || 0,
				last_updated: dbStat?.last_updated || null,
				latest_visitors: dbStat?.latest_visitors || null,
				latest_contributions: dbStat?.latest_contributions || null,
			});
		}
	}

	// Sort by data_points descending, then alphabetically
	mergedSubreddits.sort((a, b) => {
		if (b.data_points !== a.data_points) {
			return b.data_points - a.data_points;
		}
		return a.name.localeCompare(b.name);
	});

	return {
		cronStats: {
			totalRuns: totalCrons[0]?.count || 0,
			lastRun: lastCron[0] || null,
			avgDurationMs: avgDurationResult[0]?.avg || null,
		},
		subreddits: mergedSubreddits,
		dbHealth,
	};
};
