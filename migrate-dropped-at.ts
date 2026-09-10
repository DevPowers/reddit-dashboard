import 'dotenv/config';
import { db } from './src/db/index.server';
import { subreddits } from './src/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

async function main() {
    const drops = await db.select().from(subreddits).where(
        and(eq(subreddits.isActive, false), isNull(subreddits.droppedAt))
    );
    
    for (const sub of drops) {
        const lastSeen = new Date(sub.lastSeenAt);
        const droppedAt = new Date(lastSeen.getTime() + 24 * 60 * 60 * 1000);
        await db.update(subreddits).set({ droppedAt }).where(eq(subreddits.id, sub.id));
    }
    console.log(`Migrated ${drops.length} subreddits.`);
    process.exit(0);
}
main();
