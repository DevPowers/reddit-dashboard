import { db } from "../db/index.server";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running migration: rename columns + add contribution columns...");
  
  // Rename existing columns
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_dau_estimate" TO "total_weekly_visitors"`);
  console.log("✓ Renamed overall_dau_estimate → total_weekly_visitors");
  
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_dau_growth_percent" TO "visitor_growth_percent"`);
  console.log("✓ Renamed overall_dau_growth_percent → visitor_growth_percent");
  
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_net_new_dau" TO "net_new_weekly_visitors"`);
  console.log("✓ Renamed overall_net_new_dau → net_new_weekly_visitors");
  
  // Add new contribution columns
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" ADD COLUMN IF NOT EXISTS "total_weekly_contributions" integer DEFAULT 0 NOT NULL`);
  console.log("✓ Added total_weekly_contributions");
  
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" ADD COLUMN IF NOT EXISTS "contribution_growth_percent" real DEFAULT 0 NOT NULL`);
  console.log("✓ Added contribution_growth_percent");
  
  await db.execute(sql`ALTER TABLE "platform_historical_metrics" ADD COLUMN IF NOT EXISTS "net_new_weekly_contributions" integer DEFAULT 0 NOT NULL`);
  console.log("✓ Added net_new_weekly_contributions");
  
  console.log("\n✅ Migration complete!");
}
run().catch(console.error);
