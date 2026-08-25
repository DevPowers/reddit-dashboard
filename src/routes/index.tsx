import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo } from "react";
import { getMetrics, getPlatformHistory } from "../functions/metrics.functions";

// Import new simplified components
import { AggregateTrendCard } from "../components/dashboard/AggregateTrendCard";
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

	const { latestData } = useMemo(() => {
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

		const latestList = Array.from(latestMap.values()).map((latest) => {
			const hist = earliestMap.get(latest.subredditId);
			let growth = 0;
			if (hist && hist.weeklyVisitors > 0) {
				growth = ((latest.weeklyVisitors - hist.weeklyVisitors) / hist.weeklyVisitors) * 100;
			}
			return { ...latest, growthPercent: growth };
		});

		return { latestData: latestList };
	}, [dedupedDataToUse]);

	const macroMetrics = useMemo(() => {
		const latest = platformHistory[platformHistory.length - 1];
		if (!latest) return { visitorGrowthPercent: 0, totalWeeklyVisitors: 0 };
		return {
			visitorGrowthPercent: latest.visitorGrowthPercent,
			totalWeeklyVisitors: latest.totalWeeklyVisitors,
		};
	}, [platformHistory]);

	const chartData = useMemo(() => {
		// Filter out duplicate dates to ensure a clean chart line
		const uniqueDates = new Map<string, typeof platformHistory[0]>();
		
		for (const snapshot of platformHistory) {
			const dateKey = format(new Date(snapshot.recordedAt), "MMM dd");
			uniqueDates.set(dateKey, snapshot);
		}

		return Array.from(uniqueDates.values()).map(snapshot => ({
			date: format(new Date(snapshot.recordedAt), "MMM dd"),
			"Total Visitors": snapshot.totalWeeklyVisitors
		}));
	}, [platformHistory]);

	return (
		<div className="page-wrap py-10 max-w-[1400px] mx-auto px-4 sm:px-6 min-h-screen flex flex-col relative">
			{/* Ambient background glow */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orangered/5 blur-[120px] rounded-full pointer-events-none" />

			<div className="flex-grow relative z-10">
				<div className="mb-12">
					<AggregateTrendCard 
						totalVisitors={macroMetrics.totalWeeklyVisitors}
						growthPercent={macroMetrics.visitorGrowthPercent}
						chartData={chartData}
					/>
				</div>
				
				<div className="mb-12">
					<TrackedSubredditsIndex latestData={latestData} allData={dedupedDataToUse} />
				</div>
			</div>
			
			<AdminFooter />
		</div>
	);
}
