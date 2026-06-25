import { db } from "./src/db/index.server";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Executing raw SQL to rename column...");
    await db.execute(sql`ALTER TABLE platform_historical_metrics RENAME COLUMN velocity_index_score TO average_community_growth;`);
    console.log("Column renamed in Postgres.");
}
run();
