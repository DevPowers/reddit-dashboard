import { db } from "./src/db/index.js";
import { subreddits, trackingGroups, subredditGroups } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const res = await db.select({
        subId: subreddits.id,
        name: subreddits.name,
        groupId: subredditGroups.groupId,
        cat: trackingGroups.category
    })
    .from(subreddits)
    .innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId))
    .innerJoin(trackingGroups, eq(subredditGroups.groupId, trackingGroups.id))
    .where(eq(subreddits.name, 'fire'));
    
    console.log(res);
    process.exit(0);
}
main();
