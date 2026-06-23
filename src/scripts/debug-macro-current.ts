import { db } from "../db/index.server";
import { platformHistoricalMetrics, metricsHistory, subreddits, subredditGroups, trackingGroups } from "../db/schema";
import { desc, eq, ne, asc } from "drizzle-orm";
import { Category } from "../types";

async function run() {
  // 1. Show all platform_historical_metrics snapshots
  const snapshots = await db.select().from(platformHistoricalMetrics).orderBy(desc(platformHistoricalMetrics.recordedAt));
  console.log("=== ALL PLATFORM SNAPSHOTS ===");
  for (const s of snapshots) {
    console.log(`  ${s.recordedAt} | Reach: ${s.totalWeeklyReach} | Growth: ${s.weeklyReachGrowthPercent}% | NetNew: ${s.netNewWeeklyReach} | Velocity: ${s.velocityIndexScore}`);
  }

  // 2. Show latest metrics per subreddit to see what data we actually have
  const allData = await db
    .select({
      subredditId: subreddits.id,
      name: subreddits.name,
      weeklyVisitors: metricsHistory.weeklyVisitors,
      recordedAt: metricsHistory.recordedAt,
    })
    .from(metricsHistory)
    .innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
    .innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId))
    .innerJoin(trackingGroups, eq(subredditGroups.groupId, trackingGroups.id))
    .where(ne(trackingGroups.category, Category.PERSONAL_TRACKING))
    .orderBy(asc(metricsHistory.recordedAt));

  // Group by subreddit
  const bySubreddit = new Map<string, { dates: string[], visitors: number[] }>();
  for (const row of allData) {
    const key = row.name;
    if (!bySubreddit.has(key)) bySubreddit.set(key, { dates: [], visitors: [] });
    const entry = bySubreddit.get(key)!;
    entry.dates.push(new Date(row.recordedAt).toISOString().slice(0, 10));
    entry.visitors.push(row.weeklyVisitors);
  }

  console.log("\n=== SUBREDDITS WITH MULTIPLE DATA POINTS ===");
  for (const [name, data] of bySubreddit) {
    if (data.dates.length > 1) {
      console.log(`  r/${name}: ${data.dates.length} points | First: ${data.dates[0]} (${data.visitors[0]}) | Last: ${data.dates[data.dates.length-1]} (${data.visitors[data.visitors.length-1]})`);
    }
  }

  console.log("\n=== TOTAL SUBREDDITS WITH DATA ===", bySubreddit.size);
  console.log("=== SUBREDDITS WITH >1 DATA POINT ===", [...bySubreddit.values()].filter(d => d.dates.length > 1).length);
}
run();
