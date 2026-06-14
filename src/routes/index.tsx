import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { getMetrics } from "../functions/metrics.functions";
import { generateMockMetrics } from "../lib/mockData";
import { ArpuExpectation, Category } from "../types";

// Import Refactored View Components
import { PortfolioMetricsSection } from "../components/dashboard/PortfolioMetricsSection";
import { GeographicTrendsSection } from "../components/dashboard/GeographicTrendsSection";
import { SubredditDetailSection } from "../components/dashboard/SubredditDetailSection";

export const Route = createFileRoute("/")({
	component: Dashboard,
	loader: async () => {
		return await getMetrics();
	},
});

interface MetricData {
	id: number;
	subredditId: number;
	name: string;
	category: string;
	subCategory: string;
	monetizationWeight: number;
	arpuExpectation: string | null;
	population: number | null;
	weeklyVisitors: number;
	weeklyContributions: number;
	recordedAt: Date | string;
	growthPercent?: number;
}

function Dashboard() {
	const serverData = Route.useLoaderData();
	const [useMockData, setUseMockData] = useState(false);
	const [activeTier, setActiveTier] = useState<
		"high" | "medium" | "low" | null
	>(null);
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		Category.GEOGRAPHY,
	);

	// Determine data source
	const dataToUse: MetricData[] = useMockData ? generateMockMetrics() : serverData;

	// The rest of the data crunching logic remains identical to calculate growth, etc.
	const { latestData, historicalData } = useMemo(() => {
		const latestMap = new Map<number, MetricData>();
		const historicalMap = new Map<number, MetricData>();

		// T0 Benchmark Date: March 31, 2026
		const T0_DATE = new Date("2026-03-31T00:00:00Z");

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

		// Fallback for T0: If no data exists before March 31, find the EARLIEST record in the dataset.
		if (historicalMap.size === 0 && dataToUse.length > 0) {
			const earliestPerSub = new Map<number, MetricData>();
			for (const row of dataToUse) {
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
		};
	}, [dataToUse]);

	// Calculate Top-Level Portfolio Metrics
	const portfolioMetrics = useMemo(() => {
		let totalLatestDau = 0;
		let totalHistoricalDau = 0;
		let totalWeightedVelocity = 0;

		for (const sub of latestData) {
			// Proxy weekly visitors to roughly DAU
			const estDau = Math.floor(sub.weeklyVisitors / 7);
			totalLatestDau += estDau;

			// Velocity Calculation: (Est DAU * Monetization Weight * ARPU multiplier)
			let arpuMultiplier = 1.0;
			if (sub.arpuExpectation === ArpuExpectation.HIGH) arpuMultiplier = 1.5;
			if (sub.arpuExpectation === ArpuExpectation.LOW) arpuMultiplier = 0.5;

			totalWeightedVelocity += estDau * sub.monetizationWeight * arpuMultiplier;

			const hist = historicalData.find((h) => h.subredditId === sub.subredditId);
			if (hist) {
				totalHistoricalDau += Math.floor(hist.weeklyVisitors / 7);
			}
		}

		const overallGrowthPercent =
			totalHistoricalDau > 0
				? ((totalLatestDau - totalHistoricalDau) / totalHistoricalDau) * 100
				: 0;
		const overallNetNew = totalLatestDau - totalHistoricalDau;

		return {
			overallGrowthPercent,
			overallNetNew,
			weightedVelocity: totalWeightedVelocity,
		};
	}, [latestData, historicalData]);

	// Calculate ARPU Tier Aggregates
	const arpuAggregates = useMemo(() => {
		const calcTierGrowth = (tier: string) => {
			const subs = latestData.filter((s) => s.arpuExpectation === tier);
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
		const filteredData = dataToUse.filter((d) => {
			if (selectedCategory === Category.GEOGRAPHY)
				return d.category === Category.GEOGRAPHY;
			return d.category === Category.ADVERTISING_PLATFORMS;
		});

		// Group by date (ignoring time)
		const byDate = new Map<string, Record<string, number>>();
		const uniqueLines = new Set<string>();

		for (const row of filteredData) {
			const dateStr = format(new Date(row.recordedAt), "MMM dd");
			if (!byDate.has(dateStr)) byDate.set(dateStr, {});
			
			const mapForDate = byDate.get(dateStr)!;
			const subName = `r/${row.name}`;
			uniqueLines.add(subName);

			const hist = historicalData.find((h) => h.subredditId === row.subredditId);
			if (hist && hist.weeklyVisitors > 0) {
				const growth =
					((row.weeklyVisitors - hist.weeklyVisitors) / hist.weeklyVisitors) *
					100;
				mapForDate[subName] = Number(growth.toFixed(2));
			} else {
				mapForDate[subName] = 0;
			}
		}

		const dataPoints = Array.from(byDate.entries())
			.map(([date, values]) => ({
				date,
				...values,
			}))
			.sort(
				(a, b) =>
					new Date(`${a.date} 2026`).getTime() -
					new Date(`${b.date} 2026`).getTime(),
			);

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

	// Strict 5 professional terminal colors
	const colors = [
		"#6366F1", // Slate Blue
		"#FF4500", // Reddit Orangered
		"#06B6D4", // Cyan
		"#F59E0B", // Amber
		"#8B5CF6", // Purple
	];

	return (
		<div className="page-wrap py-10 max-w-7xl mx-auto px-4">
			{/* Top Bar: Title & Toggle */}
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-extrabold text-text-main tracking-tight">
						Investor Performance Dashboard
					</h1>
					<p className="text-text-muted text-sm mt-1">
						Time-series percentage growth measured against March 31, 2026.
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
				setActiveTier={setActiveTier}
			/>

			<GeographicTrendsSection 
				activeTier={activeTier}
				selectedCategory={selectedCategory}
				setSelectedCategory={setSelectedCategory}
				chartData={chartData}
				colors={colors}
			/>

			<SubredditDetailSection 
				accordionData={accordionData}
			/>
		</div>
	);
}
