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
import { ArpuExpectation, Category } from "../data/subreddits";
import { getMetrics } from "../functions/metrics.functions";
import { generateMockMetrics } from "../lib/mockData";

export const Route = createFileRoute("/")({
	component: Dashboard,
	loader: async () => {
		return await getMetrics();
	},
});

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		// Sort descending by growth value
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
							className={`font-mono font-medium ${entry.value >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
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

function Dashboard() {
	const realData = Route.useLoaderData();
	const [useMockData, setUseMockData] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		Category.GEOGRAPHY,
	);

	// Generate mock data only once
	const mockData = useMemo(() => generateMockMetrics(), []);
	const data = useMockData ? mockData : realData;

	// Process data for growth calculations
	const { chartData, latestData, arpuAggregates, countryAggregates } =
		useMemo(() => {
			if (!data || data.length === 0)
				return {
					chartData: { dataPoints: [], lines: [] },
					latestData: [],
					arpuAggregates: { high: 0, medium: 0, low: 0 },
					countryAggregates: { usa: 0, india: 0, uk: 0 },
				};

		// 1. Group by Subreddit and sort by date ascending
		const groupedBySubreddit = new Map<string, any[]>();
		data.forEach((d: any) => {
			if (!groupedBySubreddit.has(d.name)) groupedBySubreddit.set(d.name, []);
			groupedBySubreddit.get(d.name)!.push(d);
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
			// March 31, 2026 is month 2 since getMonth() is zero-indexed
			let t0Point = points.find((p) => {
				const d = new Date(p.recordedAt);
				return (
					d.getFullYear() === 2026 && d.getMonth() === 2 && d.getDate() === 31
				);
			});
			if (!t0Point) t0Point = points[0]; // fallback to earliest

			if (t0Point) t0Values.set(subName, t0Point.weeklyVisitors);
		});

		// 3. Add percentage growth
		const enrichedData = data.map((d: any) => {
			const v0 = t0Values.get(d.name) || d.weeklyVisitors;
			const growth = v0 > 0 ? ((d.weeklyVisitors - v0) / v0) * 100 : 0;
			return { ...d, growthPercent: Number(growth.toFixed(2)) };
		});

		// 4. Build chart data specifically for the selected category
		const filteredForChart = enrichedData.filter(
			(d: any) => d.category === selectedCategory,
		);
		const groupedByDate: Record<string, any> = {};
		const subredditsInView = new Set<string>();

		filteredForChart.forEach((row: any) => {
			const dateKey = format(new Date(row.recordedAt), "MMM dd, yyyy");
			if (!groupedByDate[dateKey]) {
				groupedByDate[dateKey] = { date: dateKey };
			}
			groupedByDate[dateKey][row.name] = row.growthPercent;
			subredditsInView.add(row.name);
		});

		const finalChartData = {
			dataPoints: Object.values(groupedByDate).sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			),
			lines: Array.from(subredditsInView),
		};

		// 5. Get latest data row for each subreddit (for the table and KPI cards)
		const latestRowsMap = new Map<string, any>();
		enrichedData.forEach((row: any) => {
			const existing = latestRowsMap.get(row.name);
			if (
				!existing ||
				new Date(row.recordedAt) > new Date(existing.recordedAt)
			) {
				latestRowsMap.set(row.name, row);
			}
		});
		const latestRows = Array.from(latestRowsMap.values()).sort(
			(a, b) => b.growthPercent - a.growthPercent,
		);

		// 6. Aggregate Calculations for Tier 1 and Tier 2
		const getAvgGrowth = (filterFn: (row: any) => boolean) => {
			const subset = latestRows.filter(filterFn);
			if (subset.length === 0) return 0;
			const sum = subset.reduce((acc, curr) => acc + curr.growthPercent, 0);
			return sum / subset.length;
		};

		const arpuAggs = {
			high: getAvgGrowth((r) => r.arpuExpectation === ArpuExpectation.HIGH),
			medium: getAvgGrowth((r) => r.arpuExpectation === ArpuExpectation.MEDIUM),
			low: getAvgGrowth((r) => r.arpuExpectation === ArpuExpectation.LOW),
		};

		// Tier 2 aggregate helper
		const getCountryAvg = (subs: string[]) => {
			return getAvgGrowth((r) => subs.includes(r.name));
		};
		const countryAggs = {
			usa: getCountryAvg(["AskAnAmerican", "usa"]),
			india: getCountryAvg(["india", "cricket", "indiasocial"]),
			uk: getCountryAvg(["unitedkingdom", "CasualUK"]),
		};

		return {
			chartData: finalChartData,
			latestData: latestRows,
			arpuAggregates: arpuAggs,
			countryAggregates: countryAggs,
		};
	}, [data, selectedCategory]);

	// Format helpers
	const formatGrowth = (val: number) =>
		`${val > 0 ? "+" : ""}${val.toFixed(2)}%`;

	const MetricBadge = ({ label, value }: { label: string; value: number }) => (
		<div className="flex items-center gap-2 bg-[#162428] border border-[#1F3238] rounded-full px-4 py-1.5 shadow-sm">
			<span className="text-xs font-semibold text-[#94A3B8] uppercase">
				{label}
			</span>
			<span
				className={`text-sm font-bold ${value >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
			>
				{formatGrowth(value)}
			</span>
		</div>
	);

	const colors = [
		"#FF4500", // Reddit Orangered
		"#10B981", // Success Green
		"#3B82F6", // Blue
		"#F59E0B", // Amber
		"#8B5CF6", // Purple
		"#06B6D4", // Cyan
		"#EC4899", // Pink
		"#EAB308", // Yellow
		"#14B8A6", // Teal
		"#6366F1", // Indigo
	];

	return (
		<div className="page-wrap py-10 max-w-7xl">
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

			{/* Tier 1: Aggregate ARPU KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="dash-card p-6 border-t-4 border-t-[#3B82F6]">
					<h3 className="dash-title">High ARPU Tier (US, UK, CA, DE, FR)</h3>
					<div
						className={`mt-2 dash-value ${arpuAggregates.high >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
					>
						{formatGrowth(arpuAggregates.high)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</div>
				<div className="dash-card p-6 border-t-4 border-t-[#F59E0B]">
					<h3 className="dash-title">Medium ARPU Tier (BR, MX)</h3>
					<div
						className={`mt-2 dash-value ${arpuAggregates.medium >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
					>
						{formatGrowth(arpuAggregates.medium)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</div>
				<div className="dash-card p-6 border-t-4 border-t-[#10B981]">
					<h3 className="dash-title">Low ARPU Tier (IN)</h3>
					<div
						className={`mt-2 dash-value ${arpuAggregates.low >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
					>
						{formatGrowth(arpuAggregates.low)}
					</div>
					<p className="text-xs text-[#94A3B8] mt-1">Average Growth vs Q1</p>
				</div>
			</div>

			{/* Tier 2: Specific Country Spotlights */}
			<div className="flex flex-wrap gap-4 mb-8">
				<MetricBadge label="🇺🇸 United States" value={countryAggregates.usa} />
				<MetricBadge label="🇬🇧 United Kingdom" value={countryAggregates.uk} />
				<MetricBadge label="🇮🇳 India" value={countryAggregates.india} />
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

			{/* Tier 4: Compact Metric Table */}
			<div className="dash-card overflow-hidden">
				<div className="px-6 py-4 border-b border-[#1F3238] bg-[#162428]">
					<h2 className="text-lg font-bold text-[#E2E8F0]">
						Subreddit Performance
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-[#0B1416]/50 border-b border-[#1F3238]">
							<tr>
								<th className="px-6 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Subreddit
								</th>
								<th className="px-6 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Category
								</th>
								<th className="px-6 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">
									Current Visitors
								</th>
								<th className="px-6 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-right">
									Growth vs Q1
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#1F3238]">
							{latestData.map((row: any) => (
								<tr
									key={row.id}
									className="hover:bg-[#1F3238]/30 transition-colors"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="text-sm font-medium text-[#E2E8F0]">
												r/{row.name}
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#1F3238] text-[#94A3B8]">
											{row.category.replace(/_/g, " ").toLowerCase()}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-[#E2E8F0] text-right font-mono">
										{row.weeklyVisitors.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold">
										<span
											className={
												row.growthPercent >= 0
													? "text-[#10B981]"
													: "text-[#EF4444]"
											}
										>
											{formatGrowth(row.growthPercent)}
										</span>
									</td>
								</tr>
							))}
							{latestData.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="px-6 py-8 text-center text-sm text-[#94A3B8]"
									>
										No Subreddit data available.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
