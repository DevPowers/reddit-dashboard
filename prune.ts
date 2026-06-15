import { db } from "./src/db/index.server";
import { subredditGroups, subreddits } from "./src/db/schema";
import { TARGET_SUBREDDITS } from "./src/data/subreddits";
import { notInArray, inArray } from "drizzle-orm";

async function main() {
    console.log("Starting manual prune...");
    const expectedSubNames = new Set<string>();
    for (const group of TARGET_SUBREDDITS) {
        group.subreddits.forEach((s: any) => {
            expectedSubNames.add(s);
        });
    }

    const trackedSubs = await db
        .select({ id: subreddits.id })
        .from(subreddits)
        .where(inArray(subreddits.name, Array.from(expectedSubNames)));

    if (trackedSubs.length > 0) {
        const deleted = await db
            .delete(subredditGroups)
            .where(
                notInArray(
                    subredditGroups.subredditId,
                    trackedSubs.map((s) => s.id)
                )
            ).returning();
        console.log(`Pruned ${deleted.length} obsolete group memberships.`);
    }
    console.log("Done.");
    process.exit(0);
}

main().catch(console.error);
