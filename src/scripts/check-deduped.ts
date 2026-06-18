import { db } from "../db/index.server";
import { Category } from "../types";
import { metricsHistory, subredditGroups, subreddits, trackingGroups } from "../db/schema";
import { eq, ne } from "drizzle-orm";

async function main() {
	const data = await db
		.select({
			subredditId: subreddits.id,
			monetizationWeight: trackingGroups.monetizationWeight,
			arpuMultiplier: trackingGroups.arpuMultiplier,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			recordedAt: metricsHistory.recordedAt,
		})
		.from(metricsHistory)
		.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
		.innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId))
		.innerJoin(trackingGroups, eq(subredditGroups.groupId, trackingGroups.id))
		.where(ne(trackingGroups.category, Category.PERSONAL_TRACKING));

	const dedupedMap = new Map();
	for (const row of data) {
		const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
		const existing = dedupedMap.get(key);

		if (!existing) {
			dedupedMap.set(key, row);
		} else {
			const rowRating = row.monetizationWeight * row.arpuMultiplier;
			const existingRating = existing.monetizationWeight * existing.arpuMultiplier;
			if (rowRating > existingRating) {
				dedupedMap.set(key, row);
			}
		}
	}
	const dedupedData = Array.from(dedupedMap.values());

	const dataBySubreddit = new Map();
	for (const row of dedupedData) {
		if (!dataBySubreddit.has(row.subredditId)) {
			dataBySubreddit.set(row.subredditId, []);
		}
		dataBySubreddit.get(row.subredditId).push(row);
	}

	let subCountWith2Plus = 0;
	for (const [subId, history] of dataBySubreddit.entries()) {
		if (history.length >= 2) subCountWith2Plus++;
	}

	console.log("Subreddits with >= 2 points:", subCountWith2Plus);
    process.exit(0);
}
main();
