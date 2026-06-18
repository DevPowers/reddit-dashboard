import { db } from "../db/index.server";
import { metricsHistory, subreddits, subredditGroups, trackingGroups } from "../db/schema";
import { asc, desc, eq, ne } from "drizzle-orm";
import { Category } from "../types";

async function main() {
    const data = await db
		.select({
			subredditId: subreddits.id,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			recordedAt: metricsHistory.recordedAt,
		})
		.from(metricsHistory)
		.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
		.innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId))
		.innerJoin(trackingGroups, eq(subredditGroups.groupId, trackingGroups.id))
		.where(ne(trackingGroups.category, Category.PERSONAL_TRACKING));
		
    const subMap = new Map();
    for (const row of data) {
        if (!subMap.has(row.subredditId)) subMap.set(row.subredditId, []);
        subMap.get(row.subredditId).push(row);
    }
    
    let diffWau = 0;
    let totalHistDau = 0;
    let totalLatDau = 0;
    for (const [subId, rows] of subMap.entries()) {
        rows.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        const earliest = rows[0];
        const latest = rows[rows.length - 1];
        
        const hDau = Math.floor(earliest.weeklyVisitors / 7);
        const lDau = Math.floor(latest.weeklyVisitors / 7);
        
        totalHistDau += hDau;
        totalLatDau += lDau;
    }
    console.log("Total Lat DAU:", totalLatDau);
    console.log("Total Hist DAU:", totalHistDau);
    console.log("Diff:", totalLatDau - totalHistDau);
    process.exit(0);
}
main();
