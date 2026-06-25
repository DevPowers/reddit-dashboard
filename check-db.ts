import { db } from "./src/db/index.server";
import { metricsHistory, platformHistoricalMetrics } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function run() {
    const rawMetricsCount = await db.select({ count: sql<number>`count(*)` }).from(metricsHistory);
    const rawMetricsDates = await db.select({ date: metricsHistory.recordedAt }).from(metricsHistory).orderBy(metricsHistory.recordedAt);
    
    const snapshotsCount = await db.select({ count: sql<number>`count(*)` }).from(platformHistoricalMetrics);
    
    console.log(`metricsHistory count: ${rawMetricsCount[0].count}`);
    if (rawMetricsDates.length > 0) {
        console.log(`metricsHistory min date: ${rawMetricsDates[0].date}`);
        console.log(`metricsHistory max date: ${rawMetricsDates[rawMetricsDates.length - 1].date}`);
    }
    
    console.log(`platformHistoricalMetrics count: ${snapshotsCount[0].count}`);
}
run();
