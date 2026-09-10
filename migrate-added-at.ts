import 'dotenv/config';
import { db } from './src/db/index.server';
import { subreddits } from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
    await db.execute(sql`UPDATE subreddits SET added_at = created_at`);
    console.log("Updated all addedAt to createdAt");
    
    // Manually fix hygiene
    const h = await db.select().from(subreddits).where(eq(subreddits.name, 'hygiene'));
    if (h.length > 0) {
        // Hygiene returned on Aug 26 EDT run.
        const returnDate = new Date("2026-08-27T01:49:34.000Z"); // From previous output for Run 3
        await db.update(subreddits).set({ addedAt: returnDate }).where(eq(subreddits.id, h[0].id));
        console.log("Fixed hygiene addedAt");
    }
    process.exit(0);
}
main();
