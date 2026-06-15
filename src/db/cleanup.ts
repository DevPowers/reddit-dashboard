import { sql } from "drizzle-orm";
import { db } from "./index.server";

async function cleanup() {
	console.log("Starting deduplication cleanup...");

	try {
		// Keep only the most recently inserted record per subreddit per day (in UTC)
		const res = await db.execute(sql`
            DELETE FROM subreddit_metrics 
            WHERE id NOT IN (
                SELECT MAX(id) 
                FROM subreddit_metrics 
                GROUP BY subreddit_id, DATE(recorded_at AT TIME ZONE 'UTC')
            );
        `);

		console.log("Cleanup successful!", res);
	} catch (e) {
		console.error("Cleanup failed:", e);
	}

	process.exit(0);
}

cleanup();
