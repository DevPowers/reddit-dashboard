import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo } from "react";
import { getMetrics, getPlatformHistory } from "../functions/metrics.functions";

// Import new simplified components
import { TopVisitorTrend } from "../components/dashboard/TopVisitorTrend";
import { GrowthChart } from "../components/dashboard/GrowthChart";
import { TrackedSubredditsIndex } from "../components/dashboard/TrackedSubredditsIndex";
import { AdminFooter } from "../components/admin/AdminFooter";

export const Route = createFileRoute("/")({
	component: Dashboard,
	loader: async () => {
		const [metrics, platformHistory] = await Promise.all([
			getMetrics(),
			getPlatformHistory()
		]);
		return { metrics, platformHistory };
	},
	staleTime: 60_000,
});

function Dashboard() {
	const { metrics: serverData, platformHistory } = Route.useLoaderData();

	// Deduplicate overlapping subreddits on the client side
	const dedupedDataToUse = useMemo(() => {
		const map = new Map<string, any>();
		for (const row of serverData) {
			const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
			if (!map.has(key)) {
				map.set(key, row);
			}
		}
		return Array.from(map.values());
	}, [serverData]);

	const { latestData, historicalData, baselineDateStr } = useMemo(() => {
		const latestMap = new Map<number, any>();
		const earliestMap = new Map<number, any>();

		for (const row of dedupedDataToUse) {
			const recordedAtDate = new Date(row.recordedAt);
			const currentLatest = latestMap.get(row.subredditId);
			if (!currentLatest || recordedAtDate > new Date(currentLatest.recordedAt)) {
				latestMap.set(row.subredditId, row);
			}

			const currentEarliest = earliestMap.get(row.subredditId);
			if (!currentEarliest || recordedAtDate < new Date(currentEarliest.recordedAt)) {
				earliestMap.set(row.subredditId, row);
			}
		}

		let globalEarliest: Date | null = null;
		for (const row of earliestMap.values()) {
			const d = new Date(row.recordedAt);
			if (!globalEarliest || d < globalEarliest) globalEarliest = d;
		}

		const latestList = Array.from(latestMap.values()).map((latest) => {
			const hist = earliestMap.get(latest.subredditId);
			let growth = 0;
			if (hist && hist.weeklyVisitors > 0) {
				growth = ((latest.weeklyVisitors - hist.weeklyVisitors) / hist.weeklyVisitors) * 100;
			}
			return { ...latest, growthPercent: growth };
		});

		return {
			latestData: latestList,
			historicalData: Array.from(earliestMap.values()),
			baselineDateStr: globalEarliest ? format(globalEarliest, "MMMM d, yyyy") : "N/A"
		};
	}, [dedupedDataToUse]);

	const macroMetrics = useMemo(() => {
		const latest = platformHistory[platformHistory.length - 1];
		if (!latest) return { visitorGrowthPercent: 0, netNewVisitors: 0 };
		return {
			visitorGrowthPercent: latest.visitorGrowthPercent,
			netNewVisitors: latest.netNewWeeklyVisitors,
		};
	}, [platformHistory]);

	const chartData = useMemo(() => {
		const byDate = new Map<string, { sortKey: number, sumGrowth: number, count: number }>();

		const histMap = new Map();
		for (const h of historicalData) {
			histMap.set(h.subredditId, h);
		}

		for (const row of dedupedDataToUse) {
			const recordedDate = new Date(row.recordedAt);
			const dateKey = format(recordedDate, "MMM dd, yyyy");
			
			if (!byDate.has(dateKey)) {
				byDate.set(dateKey, { sortKey: recordedDate.getTime(), sumGrowth: 0, count: 0 });
			}
			
			const entry = byDate.get(dateKey)!;
			entry.sortKey = Math.min(entry.sortKey, recordedDate.getTime());

			const hist = histMap.get(row.subredditId);
			if (hist && hist.weeklyVisitors > 0) {
				const growth = ((row.weeklyVisitors - hist.weeklyVisitors) / hist.weeklyVisitors) * 100;
				entry.sumGrowth += growth;
				entry.count += 1;
			}
		}

		return Array.from(byDate.entries())
			.sort(([, a], [, b]) => a.sortKey - b.sortKey)
			.map(([date, stats]) => ({
				date,
				"Top 250 Growth": stats.count > 0 ? Number((stats.sumGrowth / stats.count).toFixed(2)) : 0
			}));
	}, [dedupedDataToUse, historicalData]);

	return (
		<div className="page-wrap py-10 max-w-7xl mx-auto px-4 min-h-screen flex flex-col">
			<div className="flex-grow">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-extrabold text-text-main tracking-tight">
							<span className="text-orangered font-black">Reddit</span> Top 250 Tracker
						</h1>
						<p className="text-text-muted text-sm mt-1">
							Tracking the 250 most visited communities on Reddit (Baseline: {baselineDateStr})
						</p>
					</div>
				</div>

				<TopVisitorTrend metrics={macroMetrics} />
				<div className="mt-8">
					<GrowthChart data={chartData} />
				</div>
				
				<div className="mt-12">
					<TrackedSubredditsIndex latestData={latestData} allData={dedupedDataToUse} />
				</div>
			</div>
			
			<AdminFooter />
		</div>
	);
}
