import { db } from "../db/index.server";
import { metricsHistory } from "../db/schema";
import { asc, desc, eq } from "drizzle-orm";

async function main() {
    // get unique subreddits that have > 1 record
    const all = await db.select().from(metricsHistory);
    const subMap = new Map();
    for (const row of all) {
        if (!subMap.has(row.subredditId)) subMap.set(row.subredditId, []);
        subMap.get(row.subredditId).push(row);
    }
    
    let diff = 0;
    for (const [subId, rows] of subMap.entries()) {
        rows.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        const earliest = rows[0];
        const latest = rows[rows.length - 1];
        if (earliest.id !== latest.id) {
            console.log(`Sub ${subId} | Earliest: ${earliest.weeklyVisitors} LATEST: ${latest.weeklyVisitors}`);
            diff += (latest.weeklyVisitors - earliest.weeklyVisitors);
        }
    }
    console.log("Total Diff:", diff);
    process.exit(0);
}
main();
