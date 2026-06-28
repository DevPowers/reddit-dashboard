import { db } from "./src/db/index.server";
import { cronSubredditLogs } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function run() {
    const logs = await db.select().from(cronSubredditLogs).where(
        and(
            eq(cronSubredditLogs.errorMessage, 'Anti-Bot Detection Placeholder'),
            eq(cronSubredditLogs.usedPremium, true)
        )
    );
    console.log(`Premium anti-bot failures: ${logs.length}`);

    const allAntiBot = await db.select().from(cronSubredditLogs).where(
        eq(cronSubredditLogs.errorMessage, 'Anti-Bot Detection Placeholder')
    );
    console.log(`Total anti-bot failures: ${allAntiBot.length}`);
    process.exit(0);
}
run();
