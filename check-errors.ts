import { db } from "./src/db/index.server";
import { cronSubredditLogs, subreddits } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
    const logs = await db.select().from(cronSubredditLogs)
        .where(eq(cronSubredditLogs.status, 'failed'))
        .orderBy(desc(cronSubredditLogs.ranAt))
        .limit(20);
    
    logs.forEach(l => {
        console.log(`Sub: ${l.subredditId}, Err: ${l.errorMessage}, HTTP: ${l.httpCode}, Premium: ${l.usedPremium}`);
    });
    process.exit(0);
}
run();
