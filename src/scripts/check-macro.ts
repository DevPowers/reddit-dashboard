import { db } from "../db/index.server";
import { platformHistoricalMetrics } from "../db/schema";
import { desc } from "drizzle-orm";

async function main() {
	const metrics = await db.select().from(platformHistoricalMetrics).orderBy(desc(platformHistoricalMetrics.recordedAt));
	console.log("Macro Metrics:");
	metrics.forEach(m => console.log(m));
	process.exit(0);
}
main();
