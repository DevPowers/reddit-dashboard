import { db } from "../db/index.server";
import { calculateAndSaveMacroMetrics } from "../functions/macro";
import { metricsHistory, platformHistoricalMetrics } from "../db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const latestMetrics = await db.select().from(metricsHistory).orderBy(desc(metricsHistory.recordedAt)).limit(1);
  console.log("Latest raw metric recorded at:", latestMetrics[0]?.recordedAt);

  const platform = await db.select().from(platformHistoricalMetrics).orderBy(desc(platformHistoricalMetrics.recordedAt)).limit(3);
  console.log("Recent platform metrics:", platform);

  console.log("Running macro calculation...");
  const result = await calculateAndSaveMacroMetrics();
  console.log("Macro calculation result:", result);
}
run().catch(console.error).finally(() => process.exit(0));
