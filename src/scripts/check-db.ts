import { db } from "../db/index.server";
import { metricsHistory, subreddits, cronSubredditLogs } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
	const subName = "bodyweightfitness";
	const subRow = await db.select().from(subreddits).where(eq(subreddits.name, subName));
	console.log("Subreddit:", subRow[0]);

	const metrics = await db.select().from(metricsHistory).where(eq(metricsHistory.subredditId, subRow[0].id));
	console.log("Metrics:", metrics);

	const logs = await db.select().from(cronSubredditLogs).where(eq(cronSubredditLogs.subredditId, subRow[0].id));
	console.log("Logs:", logs);
	
	process.exit(0);
}
main();
