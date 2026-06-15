import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { getMetrics, getPlatformHistory } from "../functions/metrics.functions";
import { generateMockMetrics, generateMockPlatformHistory } from "../lib/mockData";
import { ArpuExpectation, Category, type MetricData } from "../types";
import {
	getQuarterEndBaseline,
} from "../lib/calculations";

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
	const [useMockData, setUseMockData] = useState(false);
	const [activeTier, setActiveTier] = useState<
		"high" | "medium" | "low" | null
	>(null);
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		Category.GEOGRAPHY,
	);

	// Synchronize state: Category changes clear the tier filter
	const handleCategoryChange = (cat: Category) => {
		setSelectedCategory(cat);
		setActiveTier(null); // Clear ARPU tier so accordion updates
	};

	// Synchronize state: Tier changes force category to GEOGRAPHY
	const handleTierChange = (tier: "high" | "medium" | "low" | null) => {
		setActiveTier(tier);
		if (tier) setSelectedCategory(Category.GEOGRAPHY);
	};

	// Generate mock data only once
	const mockData = useMemo(() => generateMockMetrics(), []);
	const mockHistory = useMemo(() => generateMockPlatformHistory(), []);

	// Determine data source
	const dataToUse: MetricData[] = useMemo(() => useMockData ? mockData : serverData, [useMockData, mockData, serverData]);
	const historyToUse = useMemo(() => useMockData ? mockHistory : platformHistory, [useMockData, mockHistory, platformHistory]);

	// The rest of the data crunching logic remains identical to calculate growth, etc.
	const { latestData, historicalData, baselineDateStr } = useMemo(() => {
		const latestMap = new Map<number, MetricData>();
		const historicalMap = new Map<number, MetricData>();

		const T0_DATE = getQuarterEndBaseline(new Date());

		for (const row of dataToUse) {
			const recordedAtDate = new Date(row.recordedAt);

			const currentLatest = latestMap.get(row.subredditId);
			if (
				!currentLatest ||
				recordedAtDate > new Date(currentLatest.recordedAt)
			) {
				latestMap.set(row.subredditId, row);
			}

			if (recordedAtDate <= T0_DATE) {
				const currentHistorical = historicalMap.get(row.subredditId);
				if (
					!currentHistorical ||
					recordedAtDate > new Date(currentHistorical.recordedAt)
				) {
					historicalMap.set(row.subredditId, row);
				}
			}
		}

		let actualBaselineDate = T0_DATE;

		// Fallback for T0: If no data exists before T0_DATE, find the EARLIEST record in the dataset.
		if (historicalMap.size === 0 && dataToUse.length > 0) {
			const earliestPerSub = new Map<number, MetricData>();
			let globalEarliest: Date | null = null;

			for (const row of dataToUse) {
				const rowDate = new Date(row.recordedAt);
				if (!globalEarliest || rowDate < globalEarliest) {
					globalEarliest = rowDate;
				}

				const currentEarliest = earliestPerSub.get(row.subredditId);
				if (
					!currentEarliest ||
					new Date(row.recordedAt) < new Date(currentEarliest.recordedAt)
				) {
					earliestPerSub.set(row.subredditId, row);
				}
			}
			for (const [subId, row] of earliestPerSub.entries()) {
				historicalMap.set(subId, row);
			}

			if (globalEarliest) {
				actualBaselineDate = globalEarliest;
			}
		}

		// Calculate individual growth
		const latestList = Array.from(latestMap.values()).map((latest) => {
			const hist = historicalMap.get(latest.subredditId);
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
			historicalData: Array.from(historicalMap.values()),
			baselineDateStr: format(actualBaselineDate, "MMMM d, yyyy")
		};
	}, [dataToUse]);

	// Deduplicated Portfolio Metrics Calculation
	const portfolioMetrics = useMemo(() => {
		const latest = historyToUse[historyToUse.length - 1];
		
		if (!latest) {
			return {
				overallGrowthPercent: 0,
				overallNetNew: 0,
				weightedVelocity: 0,
			};
		}

		return {
			overallGrowthPercent: latest.overallDauGrowthPercent,
			overallNetNew: latest.overallNetNewDau,
			weightedVelocity: latest.velocityIndexScore,
		};
	}, [historyToUse]);

	// Calculate ARPU Tier Aggregates
	const arpuAggregates = useMemo(() => {
		const calcTierGrowth = (tier: string) => {
			const subs = latestData.filter(
				(s) => s.category === Category.GEOGRAPHY && s.arpuExpectation === tier
			);
			if (subs.length === 0) return 0;
			const totalGrowth = subs.reduce(
				(sum, sub) => sum + (sub.growthPercent || 0),
				0,
			);
			return totalGrowth / subs.length;
		};

		return {
			high: calcTierGrowth(ArpuExpectation.HIGH),
			medium: calcTierGrowth(ArpuExpectation.MEDIUM),
			low: calcTierGrowth(ArpuExpectation.LOW),
		};
	}, [latestData]);

	// Generate Chart Data for selected category (Time-series)
	const chartData = useMemo(() => {
		const filteredData = dataToUse.filter((d) => d.category === selectedCategory);

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

			let lineName: string;
			if (selectedCategory === Category.GEOGRAPHY) {
				const arpu = row.arpuExpectation;
				lineName = arpu ? `${arpu.charAt(0).toUpperCase() + arpu.slice(1)} ARPU` : "Unknown ARPU";
			} else {
				lineName = row.subCategory;
			}

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
			if (activeTier) return d.arpuExpectation === activeTier;
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
	}, [latestData, selectedCategory, activeTier]);

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
				<div className="flex items-center gap-3 bg-obsidian-light px-4 py-2 border border-obsidian-border rounded-md shadow-sm">
					<label
						htmlFor="mock-toggle"
						className="text-xs font-semibold text-text-muted cursor-pointer select-none tracking-wide uppercase"
					>
						Use Mock Data
					</label>
					<div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
						<input
							type="checkbox"
							id="mock-toggle"
							checked={useMockData}
							onChange={(e) => setUseMockData(e.target.checked)}
							className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
							style={{
								transform: useMockData ? "translateX(100%)" : "translateX(0)",
								borderColor: useMockData ? "var(--color-orangered)" : "var(--color-text-muted)",
							}}
						/>
						<label
							htmlFor="mock-toggle"
							className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${useMockData ? "bg-orangered-light border border-orangered" : "bg-obsidian-border"}`}
						/>
					</div>
				</div>
			</div>

			<PortfolioMetricsSection 
				portfolioMetrics={portfolioMetrics}
				arpuAggregates={arpuAggregates}
				activeTier={activeTier}
				setActiveTier={handleTierChange}
				platformHistory={historyToUse}
			/>

			<GeographicTrendsSection 
				activeTier={activeTier}
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
