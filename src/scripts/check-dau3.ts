import { db } from "../db/index.server";
import { Category } from "../types";
import { metricsHistory, subredditGroups, subreddits, trackingGroups } from "../db/schema";
import { eq, ne } from "drizzle-orm";

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

	const dataBySubreddit = new Map();
	for (const row of data) {
		if (!dataBySubreddit.has(row.subredditId)) {
			dataBySubreddit.set(row.subredditId, []);
		}
		dataBySubreddit.get(row.subredditId).push(row);
	}

	let totalLat = 0;
	let totalHist = 0;
	for (const [subId, history] of dataBySubreddit.entries()) {
		if (history.length >= 2) {
			history.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
			const earliest = history[0];
			const latest = history[history.length - 1];
			totalLat += Math.floor(latest.weeklyVisitors / 7);
			totalHist += Math.floor(earliest.weeklyVisitors / 7);
			console.log(`Sub ${subId}: Earliest ${earliest.weeklyVisitors} Latest ${latest.weeklyVisitors}`);
		}
	}
	console.log(`Num:${totalLat} Denom:${totalHist} Diff:${totalLat - totalHist}`);
    process.exit(0);
}
main();
