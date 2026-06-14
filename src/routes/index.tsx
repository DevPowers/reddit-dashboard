import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Accordion, AccordionItem } from "../components/Accordion";
import MapChart from "../components/MapChart";
import { TARGET_SUBREDDITS } from "../data/subreddits";
import { getMetrics } from "../functions/metrics.functions";
import { generateMockMetrics } from "../lib/mockData";
import { ArpuExpectation, Category } from "../types";

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

interface TooltipProps {
	active?: boolean;
	payload?: Array<{ value: number; name: string; color: string }>;
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
	if (active && payload && payload.length) {
		const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

		return (
			<div className="bg-[#0B1416]/95 border border-[#1F3238] rounded-md p-3 text-sm shadow-xl backdrop-blur-sm min-w-[200px]">
				<p className="text-[#94A3B8] font-semibold mb-2 border-b border-[#1F3238] pb-1">
					{label}
				</p>
				{sortedPayload.map((entry, index) => (
					<div key={index} className="flex justify-between items-center py-0.5">
						<div className="flex items-center gap-2">
							<span
								className="w-2 h-2 rounded-full inline-block"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-[#E2E8F0]">{entry.name}</span>
						</div>
						<span
							className={`font-mono font-medium ${entry.value > 1 ? "text-[#10B981]" : entry.value < -1 ? "text-[#EF4444]" : "text-white"}`}
						>
							{entry.value > 0 ? "+" : ""}
							{entry.value.toFixed(1)}%
						</span>
					</div>
				))}
			</div>
		);
	}
	return null;
};

// Map lookups for subreddits
const subCategoryMap = new Map<string, string>();
const arpuMap = new Map<string, ArpuExpectation>();
TARGET_SUBREDDITS.forEach((group) => {
	group.subreddits.forEach((sub) => {
		subCategoryMap.set(sub, group.subCategory);
		if (group.arpuExpectation) {
			arpuMap.set(sub, group.arpuExpectation);
		}
	});
});

function Dashboard() {
	const realData = Route.useLoaderData();
	const [useMockData, setUseMockData] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		Category.GEOGRAPHY,
	);
	const [activeTier, setActiveTier] = useState<
		"high" | "medium" | "low" | null
	>(null);

	const mockData = useMemo(() => generateMockMetrics(), []);
	const data = useMockData ? mockData : realData;

	const { chartData, latestData, arpuAggregates, portfolioMetrics } =
		useMemo(() => {
			if (!data || data.length === 0)
				return {
					chartData: { dataPoints: [], lines: [] },
					latestData: [],
					arpuAggregates: { high: 0, medium: 0, low: 0 },
					portfolioMetrics: {
						overallGrowthPercent: 0,
						overallNetNew: 0,
						weightedVelocity: 0,
					},
				};

			// 1. Group by Subreddit and sort by date ascending
			const groupedBySubreddit = new Map<string, MetricData[]>();
			data.forEach((d: any) => {
				if (!groupedBySubreddit.has(d.name)) groupedBySubreddit.set(d.name, []);
				groupedBySubreddit.get(d.name)?.push(d);
			});

			groupedBySubreddit.forEach((points) => {
				points.sort(
					(a, b) =>
						new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
				);
			});

			// 2. Identify the T0 value for each subreddit
			const t0Values = new Map<string, number>();
			groupedBySubreddit.forEach((points, subName) => {
				let t0Point = points.find((p) => {
					const d = new Date(p.recordedAt);
					return (
						d.getFullYear() === 2026 && d.getMonth() === 2 && d.getDate() === 31
					);
				});
				if (!t0Point) t0Point = points[0];
				if (t0Point) t0Values.set(subName, t0Point.weeklyVisitors);
			});

			// 3. Add percentage growth
			const enrichedData: any[] = data.map((d: any) => {
				const v0 = t0Values.get(d.name) || d.weeklyVisitors;
				const growth = v0 > 0 ? ((d.weeklyVisitors - v0) / v0) * 100 : 0;
				return { ...d, growthPercent: Number(growth.toFixed(2)) };
			});

			// 4. Build chart data aggregated by grouping rule (Max 5 Lines)
			const filteredForChart = enrichedData.filter(
				(d: any) => d.category === selectedCategory,
			);
			const groupedByDate: Record<string, Record<string, number[]>> = {};
			const linesInView = new Set<string>();

			filteredForChart.forEach((row: MetricData) => {
				const dateKey = format(new Date(row.recordedAt), "MMM dd, yyyy");
				if (!groupedByDate[dateKey]) {
					groupedByDate[dateKey] = {};
				}

				// Determine bucket based on tab
				let bucket = "Other";
				if (selectedCategory === Category.GEOGRAPHY) {
					const arpu = arpuMap.get(row.name);
					bucket = arpu
						? `${arpu.charAt(0).toUpperCase() + arpu.slice(1)} ARPU`
						: "Unknown";
				} else {
					bucket = subCategoryMap.get(row.name) || "Unknown";
				}

				if (!groupedByDate[dateKey][bucket]) {
					groupedByDate[dateKey][bucket] = [];
				}
				groupedByDate[dateKey][bucket].push(row.growthPercent || 0);
				linesInView.add(bucket);
			});

			// Average the buckets for each date
			const finalDataPoints = Object.entries(groupedByDate).map(
				([date, buckets]) => {
					const point: Record<string, string | number> = { date };
					Object.entries(buckets).forEach(([bucket, values]) => {
						const sum = values.reduce((a, b) => a + b, 0);
						point[bucket] = sum / values.length;
					});
					return point;
				},
			);

			finalDataPoints.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			// 5. Get latest data row for each subreddit
			const latestRowsMap = new Map<string, MetricData>();
			enrichedData.forEach((row: MetricData) => {
				const existing = latestRowsMap.get(row.name);
				if (
					!existing ||
					new Date(row.recordedAt).getTime() >
						new Date(existing.recordedAt).getTime()
				) {
					latestRowsMap.set(row.name, row);
				}
			});
			const latestRows = Array.from(latestRowsMap.values());

			// 6. Aggregate KPI Calculations (High, Med, Low ARPU)
			const getAvgGrowth = (filterFn: (row: MetricData) => boolean) => {
				const subset = latestRows.filter(filterFn);
				if (subset.length === 0) return 0;
				const sum = subset.reduce(
					(acc, curr) => acc + (curr.growthPercent || 0),
					0,
				);
				return sum / subset.length;
			};

			// 7. Overall Portfolio DAU & Weighted Velocity
			let sumBaseV = 0;
			let sumLatestV = 0;
			let sumWeightedGrowth = 0;

			latestRows.forEach((row) => {
				const baseV = t0Values.get(row.name) || row.weeklyVisitors;
				const latestV = row.weeklyVisitors;
				const weight = row.monetizationWeight || 1;

				sumBaseV += baseV;
				sumLatestV += latestV;
				sumWeightedGrowth += (latestV - baseV) * weight;
			});

			const overallGrowthPercent =
				sumBaseV > 0 ? ((sumLatestV - sumBaseV) / sumBaseV) * 100 : 0;
			const overallNetNew = sumLatestV - sumBaseV;

			return {
				chartData: {
					dataPoints: finalDataPoints,
					lines: Array.from(linesInView),
				},
				latestData: latestRows,
				arpuAggregates: {
					high: getAvgGrowth(
						(r) => arpuMap.get(r.name) === ArpuExpectation.HIGH,
					),
					medium: getAvgGrowth(
						(r) => arpuMap.get(r.name) === ArpuExpectation.MEDIUM,
					),
					low: getAvgGrowth((r) => arpuMap.get(r.name) === ArpuExpectation.LOW),
				},
				portfolioMetrics: {
					overallGrowthPercent,
					overallNetNew,
					weightedVelocity: sumWeightedGrowth,
				},
			};
		}, [data, selectedCategory]);

	// Calculate nested data for Accordion based on selectedCategory
	const accordionData = useMemo(() => {
		const filtered = latestData.filter(
			(d: MetricData) => d.category === selectedCategory,
		);
		const groups = new Map<string, MetricData[]>();

		filtered.forEach((row) => {
			let bucket = "Other";
			if (selectedCategory === Category.GEOGRAPHY) {
				const arpu = arpuMap.get(row.name);
				bucket = arpu
					? `${arpu.charAt(0).toUpperCase() + arpu.slice(1)} ARPU`
					: "Unknown";
			} else {
				bucket = subCategoryMap.get(row.name) || "Unknown";
			}
			if (!groups.has(bucket)) groups.set(bucket, []);
			groups.get(bucket)?.push(row);
		});

		return Array.from(groups.entries())
			.map(([groupName, items]) => {
				const avgGrowth =
					items.reduce((acc, curr) => acc + (curr.growthPercent || 0), 0) /
					items.length;
				return {
					groupName,
					avgGrowth,
					items: items.sort((a, b) => (b.growthPercent || 0) - (a.growthPercent || 0)),
				};
			})
			.sort((a, b) => b.avgGrowth - a.avgGrowth); // Sort groups by avg growth descending
	}, [latestData, selectedCategory]);

	const formatGrowth = (val: number) =>
		`${val > 0 ? "+" : ""}${val.toFixed(2)}%`;

	const getGrowthColorClass = (val: number) => {
		if (val > 1) return "text-[#10B981]";
		if (val < -1) return "text-[#EF4444]";
		return "text-white";
	};

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
					<h1 className="text-3xl font-extrabold text-[#E2E8F0] tracking-tight">
						Investor Performance Dashboard
					</h1>
					<p className="text-[#94A3B8] text-sm mt-1">
						Time-series percentage growth measured against March 31, 2026.
					</p>
				</div>
				<div className="flex items-center gap-3 bg-[#162428] px-4 py-2 border border-[#1F3238] rounded-md shadow-sm">
					<label
						htmlFor="mock-toggle"
						className="text-xs font-semibold text-[#94A3B8] cursor-pointer select-none tracking-wide uppercase"
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
								borderColor: useMockData ? "#FF4500" : "#94A3B8",
							}}
						/>
						<label
							htmlFor="mock-toggle"
							className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${useMockData ? "bg-[#FF4500]/20 border border-[#FF4500]" : "bg-[#1F3238]"}`}
						/>
					</div>
				</div>
			</div>

			{/* Hero KPI: Overall Portfolio Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="dash-card p-8 bg-gradient-to-br from-[#162428] to-[#0B1416] border-[#FF4500]/20 shadow-[0_4px_20px_rgba(255,69,0,0.05)] relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4500]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					<h3 className="dash-title text-base font-semibold text-[#94A3B8] mb-1">
						Overall DAU Estimated Growth
					</h3>
					<div className="flex items-end gap-3 mt-3">
						<span
							className={`text-5xl font-extrabold tracking-tight ${getGrowthColorClass(portfolioMetrics.overallGrowthPercent)}`}
						>
							{formatGrowth(portfolioMetrics.overallGrowthPercent)}
						</span>
					</div>
					<div className="mt-3 text-[#94A3B8] text-sm flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
						<span className="text-[#E2E8F0] font-medium">
							+{portfolioMetrics.overallNetNew.toLocaleString()}
						</span>{" "}
						net new daily active users
					</div>
				</div>

				<div className="dash-card p-8 bg-gradient-to-br from-[#162428] to-[#0B1416] border-[#6366F1]/20 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-[#6366F1]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					<h3 className="dash-title text-base font-semibold text-[#94A3B8] mb-1">
						DAU ARPU Velocity (Weighted)
					</h3>
					<div className="flex items-end gap-3 mt-3">
						<span
							className={`text-5xl font-extrabold tracking-tight ${portfolioMetrics.weightedVelocity > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
						>
							{portfolioMetrics.weightedVelocity > 0 ? "+" : ""}
							{(portfolioMetrics.weightedVelocity / 1000000).toFixed(2)}M
						</span>
					</div>
					<div className="mt-3 text-[#94A3B8] text-sm flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
						Weighted aggregate DAU factoring monetization scale
					</div>
				</div>
			</div>

			{/* Tier 1: Aggregate ARPU KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "high" ? null : "high")}
					className={`dash-card p-6 border-t-4 border-t-[#FCD34D] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "high" ? "ring-2 ring-[#FCD34D] bg-[#162428]" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]" />
						High ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.high)}`}
					>
						{formatGrowth(arpuAggregates.high)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</button>

				<button
					type="button"
					onClick={() =>
						setActiveTier(activeTier === "medium" ? null : "medium")
					}
					className={`dash-card p-6 border-t-4 border-t-[#94A3B8] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "medium" ? "ring-2 ring-[#94A3B8] bg-[#162428]" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
						Medium ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.medium)}`}
					>
						{formatGrowth(arpuAggregates.medium)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</button>

				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "low" ? null : "low")}
					className={`dash-card p-6 border-t-4 border-t-[#B45309] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "low" ? "ring-2 ring-[#B45309] bg-[#162428]" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
						Low ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.low)}`}
					>
						{formatGrowth(arpuAggregates.low)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</button>
			</div>

			{/* Tier 2: Dynamic Map Component */}
			<div className="mb-8 p-4 bg-[#0B1416]/50 border border-[#1F3238] rounded-xl flex justify-center">
				<MapChart activeTier={activeTier} />
			</div>

			{/* Tier 3: Main Stage Recharts */}
			<div className="dash-card p-6 mb-8">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-lg font-bold text-[#E2E8F0]">
						Relative Growth Trajectory
					</h2>
					<div className="flex gap-2">
						{Object.values(Category).map((cat) => (
							<button
								type="button"
								key={cat}
								onClick={() => setSelectedCategory(cat as Category)}
								className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
									selectedCategory === cat
										? "bg-[#FF4500] text-white border-[#FF4500] shadow-[0_0_10px_rgba(255,69,0,0.3)]"
										: "bg-[#162428] text-[#94A3B8] border-[#1F3238] hover:border-[#94A3B8]"
								}`}
							>
								{cat.replace(/_/g, " ").toUpperCase()}
							</button>
						))}
					</div>
				</div>

				<div className="h-[450px] w-full">
					{chartData.dataPoints.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={chartData.dataPoints}
								margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#1F3238"
									vertical={false}
								/>
								<XAxis
									dataKey="date"
									stroke="#94A3B8"
									tick={{ fill: "#94A3B8", fontSize: 12 }}
									tickLine={false}
									axisLine={{ stroke: "#1F3238" }}
								/>
								<YAxis
									stroke="#94A3B8"
									tick={{ fill: "#94A3B8", fontSize: 12 }}
									tickFormatter={(val) => `${val}%`}
									tickLine={false}
									axisLine={{ stroke: "#1F3238" }}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Legend wrapperStyle={{ paddingTop: "20px" }} />
								{chartData.lines.map((line, idx) => (
									<Line
										key={line}
										type="monotone"
										dataKey={line}
										stroke={colors[idx % colors.length]}
										strokeWidth={2.5}
										dot={false}
										activeDot={{
											r: 6,
											fill: colors[idx % colors.length],
											stroke: "#0B1416",
											strokeWidth: 2,
										}}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-full text-[#94A3B8] bg-[#162428]/50 rounded-lg border border-dashed border-[#1F3238]">
							No data points found to plot. Toggle Mock Data for preview.
						</div>
					)}
				</div>
			</div>

			{/* Tier 4: Accordion Metric Table */}
			<div className="dash-card overflow-hidden">
				<div className="px-6 py-4 border-b border-[#1F3238] bg-[#162428]">
					<h2 className="text-lg font-bold text-[#E2E8F0]">
						Aggregated Performance Breakdown
					</h2>
				</div>
				<Accordion>
					{accordionData.length > 0 ? (
						accordionData.map((group) => (
							<AccordionItem
								key={group.groupName}
								title={group.groupName}
								value={formatGrowth(group.avgGrowth)}
								valueClass={getGrowthColorClass(group.avgGrowth)}
							>
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead className="bg-[#0B1416]/30 border-b border-[#1F3238]">
											<tr>
												<th className="px-4 py-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
													Subreddit
												</th>
												<th className="px-4 py-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">
													Current Visitors
												</th>
												<th className="px-4 py-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">
													Growth
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#1F3238]/50">
											{group.items.map((row: MetricData) => (
												<tr
													key={row.id}
													className="hover:bg-[#1F3238]/20 transition-colors"
												>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#E2E8F0]">
														r/{row.name}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-[#E2E8F0] text-right font-mono">
														{row.weeklyVisitors.toLocaleString()}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-bold">
														<span
															className={getGrowthColorClass(row.growthPercent || 0)}
														>
															{formatGrowth(row.growthPercent || 0)}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</AccordionItem>
						))
					) : (
						<div className="px-6 py-8 text-center text-sm text-[#94A3B8]">
							No Subreddit data available.
						</div>
					)}
				</Accordion>
			</div>
		</div>
	);
}
