import { db } from "../db/index.server";
import { platformHistoricalMetrics } from "../db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const latest = await db.select().from(platformHistoricalMetrics).orderBy(desc(platformHistoricalMetrics.recordedAt)).limit(1);
  console.log("Latest DB Metric:", latest[0]);
}
run();
