import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { getMetrics, getPlatformHistory } from "../functions/metrics.functions";
import { Category, type MetricData } from "../types";


// Import Refactored View Components
import { PortfolioMetricsSection } from "../components/dashboard/PortfolioMetricsSection";
import { GeographicTrendsSection } from "../components/dashboard/GeographicTrendsSection";
import { SubredditDetailSection } from "../components/dashboard/SubredditDetailSection";

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
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		Category.GEOGRAPHY,
	);

	const handleCategoryChange = (cat: Category) => {
		setSelectedCategory(cat);
	};

	// Determine data source
	const dataToUse: MetricData[] = serverData;
	const historyToUse = platformHistory;

	// Deduplicate overlapping subreddits (e.g. r/gaming) on the client side
	// to prevent double-counting in charts and accordions.
	const dedupedDataToUse = useMemo(() => {
		const map = new Map<string, MetricData>();
		for (const row of dataToUse) {
			const key = `${row.subredditId}-${new Date(row.recordedAt).getTime()}`;
			const existing = map.get(key);

			if (!existing) {
				map.set(key, row);
			}
		}
		return Array.from(map.values());
	}, [dataToUse]);

	// The rest of the data crunching logic remains identical to calculate growth, etc.
	const { latestData, historicalData, baselineDateStr } = useMemo(() => {
		const latestMap = new Map<number, MetricData>();
		const earliestMap = new Map<number, MetricData>();

		// Use "earliest record per sub" as baseline — matches macro.ts server-side logic.
		// This avoids the quarter-end baseline inconsistency where no data exists before T0.
		for (const row of dedupedDataToUse) {
			const recordedAtDate = new Date(row.recordedAt);

			const currentLatest = latestMap.get(row.subredditId);
			if (
				!currentLatest ||
				recordedAtDate > new Date(currentLatest.recordedAt)
			) {
				latestMap.set(row.subredditId, row);
			}

			const currentEarliest = earliestMap.get(row.subredditId);
			if (
				!currentEarliest ||
				recordedAtDate < new Date(currentEarliest.recordedAt)
			) {
				earliestMap.set(row.subredditId, row);
			}
		}

		// Find earliest global date for display
		let globalEarliest: Date | null = null;
		for (const row of earliestMap.values()) {
			const d = new Date(row.recordedAt);
			if (!globalEarliest || d < globalEarliest) globalEarliest = d;
		}

		// Calculate individual growth using same-store logic (earliest baseline)
		const latestList = Array.from(latestMap.values()).map((latest) => {
			const hist = earliestMap.get(latest.subredditId);
			let growth = 0;
			if (hist && hist.weeklyVisitors > 0) {
				growth =
					((latest.weeklyVisitors - hist.weeklyVisitors) /
						hist.weeklyVisitors) *
					100;
			}
			return { ...latest, growthPercent: growth };
		});

		return {
			latestData: latestList,
			historicalData: Array.from(earliestMap.values()),
			baselineDateStr: globalEarliest ? format(globalEarliest, "MMMM d, yyyy") : "N/A"
		};
	}, [dataToUse]);

	// Deduplicated Portfolio Metrics Calculation
	const portfolioMetrics = useMemo(() => {
		const latest = historyToUse[historyToUse.length - 1];
		
		if (!latest) {
			return {
				visitorGrowthPercent: 0,
				netNewVisitors: 0,
				contributionGrowthPercent: 0,
				netNewContributions: 0,
				weightedVelocity: 0,
			};
		}

		return {
			visitorGrowthPercent: latest.visitorGrowthPercent,
			netNewVisitors: latest.netNewWeeklyVisitors,
			contributionGrowthPercent: latest.contributionGrowthPercent,
			netNewContributions: latest.netNewWeeklyContributions,
			weightedVelocity: latest.velocityIndexScore,
		};
	}, [historyToUse]);



	// Generate Chart Data for selected category (Time-series)
	const chartData = useMemo(() => {
		const filteredData = dedupedDataToUse.filter((d) => d.category === selectedCategory);

		// Optimize historicalData lookup
		const histMap = new Map();
		for (const h of historicalData) {
			histMap.set(h.subredditId, h);
		}

		// Group by date with a numeric sort key for proper ordering
		const byDate = new Map<string, { sortKey: number; categories: Map<string, { sumGrowth: number; count: number }> }>();
		const uniqueLines = new Set<string>();

		for (const row of filteredData) {
			const recordedDate = new Date(row.recordedAt);
			const dateKey = format(recordedDate, "MMM dd, yyyy");
			if (!byDate.has(dateKey)) {
				byDate.set(dateKey, { sortKey: recordedDate.getTime(), categories: new Map() });
			}

			const entry = byDate.get(dateKey)!;
			// Use earliest timestamp for this date as the sort key
			entry.sortKey = Math.min(entry.sortKey, recordedDate.getTime());

			const lineName = row.subCategory;

			uniqueLines.add(lineName);

			if (!entry.categories.has(lineName)) {
				entry.categories.set(lineName, { sumGrowth: 0, count: 0 });
			}

			const hist = histMap.get(row.subredditId);
			if (hist && hist.weeklyVisitors > 0) {
				const growth =
					((row.weeklyVisitors - hist.weeklyVisitors) / hist.weeklyVisitors) *
					100;

				const stats = entry.categories.get(lineName)!;
				stats.sumGrowth += growth;
				stats.count += 1;
			}
		}

		const dataPoints = Array.from(byDate.entries())
			.sort(([, a], [, b]) => a.sortKey - b.sortKey)
			.map(([date, { categories }]) => {
				const point: any = { date };
				for (const [subCat, stats] of categories.entries()) {
					point[subCat] = stats.count > 0 ? Number((stats.sumGrowth / stats.count).toFixed(2)) : 0;
				}
				return point;
			});

		return {
			dataPoints,
			lines: Array.from(uniqueLines),
		};
	}, [dataToUse, selectedCategory, historicalData]);

	// Generate Accordion Data grouped by Sub-Category
	const accordionData = useMemo(() => {
		const filtered = latestData.filter((d) => {
			return d.category === selectedCategory;
		});

		const groups = new Map<string, MetricData[]>();
		for (const row of filtered) {
			if (!groups.has(row.subCategory)) groups.set(row.subCategory, []);
			groups.get(row.subCategory)!.push(row);
		}

		return Array.from(groups.entries())
			.map(([groupName, items]) => {
				const validItems = items.filter((i) => i.growthPercent !== undefined);
				const avgGrowth =
					validItems.length > 0
						? validItems.reduce((sum, i) => sum + (i.growthPercent || 0), 0) /
							validItems.length
						: 0;
				return { groupName, items, avgGrowth };
			})
			.sort((a, b) => b.avgGrowth - a.avgGrowth); // Sort groups by avg growth descending
	}, [latestData, selectedCategory]);

	const colors = useMemo(() => [
		"var(--color-chart-1)",
		"var(--color-chart-2)",
		"var(--color-chart-3)",
		"var(--color-chart-4)",
		"var(--color-chart-5)",
		"var(--color-chart-6)",
		"var(--color-chart-7)",
		"var(--color-chart-8)",
		"var(--color-chart-9)",
		"var(--color-chart-10)",
		"var(--color-chart-11)",
		"var(--color-chart-12)",
		"var(--color-chart-13)",
		"var(--color-chart-14)",
		"var(--color-chart-15)",
	], []);

	return (
		<div className="page-wrap py-10 max-w-7xl mx-auto px-4">
			{/* Top Bar: Title & Toggle */}
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-extrabold text-text-main tracking-tight">
						<span className="text-orangered font-black">Reddit</span> Performance Dashboard
					</h1>
					<p className="text-text-muted text-sm mt-1">
						Time-series percentage growth measured against {baselineDateStr}.
					</p>
				</div>
			</div>

			<PortfolioMetricsSection 
				portfolioMetrics={portfolioMetrics}
				platformHistory={historyToUse}
			/>

			<GeographicTrendsSection 
				selectedCategory={selectedCategory}
				setSelectedCategory={handleCategoryChange}
				chartData={chartData}
				colors={colors}
			/>

			<SubredditDetailSection 
				accordionData={accordionData}
			/>
		</div>
	);
}
