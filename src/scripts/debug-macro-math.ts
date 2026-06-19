import { db } from "../db/index.server";
import { metricsHistory, subreddits } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { getQuarterEndBaseline } from "../lib/calculations";

async function run() {
	const data = await db
		.select({
			subredditId: metricsHistory.subredditId,
			name: subreddits.name,
			weeklyVisitors: metricsHistory.weeklyVisitors,
			recordedAt: metricsHistory.recordedAt,
		})
		.from(metricsHistory)
		.innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
        .orderBy(asc(metricsHistory.recordedAt));

	const dataBySub = new Map();
	for (const row of data) {
		if (!dataBySub.has(row.name)) dataBySub.set(row.name, []);
		dataBySub.get(row.name).push(row);
	}

    let num = 0;
    let denom = 0;

	for (const [name, history] of dataBySub.entries()) {
		if (history.length >= 2) {
            const latest = history[history.length - 1];
            // Get baseline
            const T0_DATE = getQuarterEndBaseline(new Date());
            let hist = history.find(h => new Date(h.recordedAt) <= T0_DATE);
            if (!hist) {
                hist = history[0]; // fallback to earliest
            }

            if (hist.recordedAt !== latest.recordedAt) {
                console.log(`Subreddit: ${name} | Latest: ${latest.weeklyVisitors} | Hist: ${hist.weeklyVisitors} | Diff: ${latest.weeklyVisitors - hist.weeklyVisitors}`);
                num += latest.weeklyVisitors;
                denom += hist.weeklyVisitors;
            }
		}
	}
    console.log(`Total Num: ${num} | Total Denom: ${denom} | Diff (Net New): ${num - denom}`);
}
run();
