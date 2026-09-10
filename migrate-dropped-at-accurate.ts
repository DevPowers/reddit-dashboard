import 'dotenv/config';
import { db } from './src/db/index.server';
import { subreddits, cronLogs, metricsHistory } from './src/db/schema';
import { eq, gt, asc, and } from 'drizzle-orm';

async function main() {
    const drops = await db.select().from(subreddits).where(eq(subreddits.isActive, false));
    
    let updatedCount = 0;
    for (const sub of drops) {
        // Find the first successful cron run that occurred AFTER this subreddit's lastSeenAt
        const nextScrape = await db.select()
            .from(cronLogs)
            .where(
                and(
                    eq(cronLogs.status, 'success'),
                    gt(cronLogs.ranAt, sub.lastSeenAt)
                )
            )
            .orderBy(asc(cronLogs.ranAt))
            .limit(1);
            
        if (nextScrape.length > 0) {
            const accurateDropDate = nextScrape[0].ranAt;
            await db.update(subreddits).set({ droppedAt: accurateDropDate }).where(eq(subreddits.id, sub.id));
            console.log(`Updated ${sub.name} droppedAt to ${accurateDropDate}`);
            updatedCount++;
        }
    }
    console.log(`Accurately migrated ${updatedCount} subreddits.`);
    process.exit(0);
}
main();
