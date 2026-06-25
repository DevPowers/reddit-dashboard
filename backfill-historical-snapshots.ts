import { db } from "./src/db/index.server";
import { metricsHistory, platformHistoricalMetrics, subreddits, subredditGroups, trackingGroups } from "./src/db/schema";
import { eq, notInArray, lte } from "drizzle-orm";
import { calculateSubVelocity, normalizeVelocityScore, findClosestToDate } from "./src/lib/calculations";
import { Category } from "./src/types";

async function backfill() {
    console.log("Wiping current snapshots...");
    await db.delete(platformHistoricalMetrics);

    // Get all unique dates from metricsHistory
    const allDatesRes = await db.execute(`SELECT DISTINCT DATE(recorded_at) as d FROM metrics_history ORDER BY d ASC`);
    const dates = allDatesRes.map(r => new Date(r.d as string));
    
    console.log(`Found ${dates.length} distinct days in metrics_history.`);

    for (const targetDate of dates) {
        // Set targetDate to end of day
        targetDate.setHours(23, 59, 59, 999);

        const data = await db
            .select({
                id: metricsHistory.id,
                subredditId: subreddits.id,
                weeklyVisitors: metricsHistory.weeklyVisitors,
                weeklyContributions: metricsHistory.weeklyContributions,
                recordedAt: metricsHistory.recordedAt,
            })
            .from(metricsHistory)
            .innerJoin(subreddits, eq(metricsHistory.subredditId, subreddits.id))
            .innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId))
            .innerJoin(trackingGroups, eq(subredditGroups.groupId, trackingGroups.id))
            .where(
                notInArray(trackingGroups.category, [Category.PERSONAL_TRACKING, Category.SPORTS])
            );

        // Filter data to only include up to targetDate
        const filteredData = data.filter(r => new Date(r.recordedAt).getTime() <= targetDate.getTime());

        if (filteredData.length === 0) continue;

        const dedupedMap = new Map<string, typeof data[0]>();
        for (const row of filteredData) {
            const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
            if (!dedupedMap.has(key)) dedupedMap.set(key, row);
        }
        const dedupedData = Array.from(dedupedMap.values());

        const dataBySubreddit = new Map<number, typeof data>();
        for (const row of dedupedData) {
            if (!dataBySubreddit.has(row.subredditId)) dataBySubreddit.set(row.subredditId, []);
            dataBySubreddit.get(row.subredditId)!.push(row);
        }

        for (const history of dataBySubreddit.values()) {
            history.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        }

        const latestMap = new Map<number, typeof data[0]>();
        for (const row of dedupedData) {
            const existing = latestMap.get(row.subredditId);
            if (!existing || new Date(row.recordedAt) > new Date(existing.recordedAt)) {
                latestMap.set(row.subredditId, row);
            }
        }
        const latestData = Array.from(latestMap.values());

        const baselineMap = new Map<number, typeof data[0]>();
        for (const row of dedupedData) {
            const existing = baselineMap.get(row.subredditId);
            if (!existing || new Date(row.recordedAt) < new Date(existing.recordedAt)) {
                baselineMap.set(row.subredditId, row);
            }
        }

        const velocityTargetDate = new Date(targetDate);
        velocityTargetDate.setDate(velocityTargetDate.getDate() - 28);

        let totalLatestReach = 0;
        let growthNumeratorLatestReach = 0;
        let growthDenominatorBaselineReach = 0;
        let totalLatestContributions = 0;
        let growthNumeratorLatestContributions = 0;
        let growthDenominatorBaselineContributions = 0;
        let totalWeightedVelocity = 0;
        let velocityContributorCount = 0;

        for (const sub of latestData) {
            const reach = sub.weeklyVisitors;
            const contributions = sub.weeklyContributions;
            totalLatestReach += reach;
            totalLatestContributions += contributions;

            const subHistory = dataBySubreddit.get(sub.subredditId) || [];
            const baseline = baselineMap.get(sub.subredditId);

            const distinctDates = new Set(subHistory.map((r) => new Date(r.recordedAt).toISOString().slice(0, 10)));

            if (distinctDates.size >= 2 && baseline) {
                growthDenominatorBaselineReach += baseline.weeklyVisitors;
                growthNumeratorLatestReach += reach;
                growthDenominatorBaselineContributions += baseline.weeklyContributions;
                growthNumeratorLatestContributions += contributions;

                const baselinePoint = findClosestToDate(subHistory, velocityTargetDate);
                const baselineWau = baselinePoint ? baselinePoint.weeklyVisitors : sub.weeklyVisitors;

                if (baselinePoint && new Date(baselinePoint.recordedAt).toISOString().slice(0, 10) !== new Date(sub.recordedAt).toISOString().slice(0, 10)) {
                    // NEW PURE PERCENTAGE LOGIC (arpuMultiplier = 1.0, weight = 1.0)
                    const velocity = calculateSubVelocity(sub.weeklyVisitors, baselineWau, 1.0, 1.0);
                    totalWeightedVelocity += velocity;
                    velocityContributorCount++;
                }
            }
        }

        const overallGrowthPercent = growthDenominatorBaselineReach > 0 ? ((growthNumeratorLatestReach - growthDenominatorBaselineReach) / growthDenominatorBaselineReach) * 100 : 0;
        const overallNetNewReach = growthNumeratorLatestReach - growthDenominatorBaselineReach;
        const overallContributionGrowthPercent = growthDenominatorBaselineContributions > 0 ? ((growthNumeratorLatestContributions - growthDenominatorBaselineContributions) / growthDenominatorBaselineContributions) * 100 : 0;
        const overallNetNewContributions = growthNumeratorLatestContributions - growthDenominatorBaselineContributions;
        const averageCommunityGrowth = normalizeVelocityScore(totalWeightedVelocity, velocityContributorCount);

        await db.insert(platformHistoricalMetrics).values({
            totalWeeklyVisitors: totalLatestReach,
            visitorGrowthPercent: overallGrowthPercent,
            netNewWeeklyVisitors: overallNetNewReach,
            totalWeeklyContributions: totalLatestContributions,
            contributionGrowthPercent: overallContributionGrowthPercent,
            netNewWeeklyContributions: overallNetNewContributions,
            averageCommunityGrowth: averageCommunityGrowth,
            recordedAt: targetDate,
        });
        
        console.log(`Inserted snapshot for ${targetDate.toISOString().slice(0,10)}`);
    }
    console.log("Backfill complete!");
}

backfill();
