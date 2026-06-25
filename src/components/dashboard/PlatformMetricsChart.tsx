import { format } from "date-fns";
import { useMemo } from "react";
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

interface HistoricalMetric {
	id: number;
	recordedAt: Date | string;
	totalWeeklyVisitors: number;
	netNewWeeklyVisitors: number;
	totalWeeklyContributions: number;
	netNewWeeklyContributions: number;
	averageCommunityGrowth: number;
}

interface PlatformMetricsChartProps {
	data: HistoricalMetric[];
}

export function PlatformMetricsChart({ data }: PlatformMetricsChartProps) {
	const chartData = useMemo(() => {
		// Sort chronologically just to be safe
		const sorted = [...data].sort(
			(a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
		);

		return sorted.map((row) => ({
			date: format(new Date(row.recordedAt), "MMM dd"),
			"Net New Visitors": row.netNewWeeklyVisitors,
			"Net New Contributions": row.netNewWeeklyContributions,
			"Avg Community Growth": Number(row.averageCommunityGrowth.toFixed(2)),
		}));
	}, [data]);

	if (chartData.length === 0) {
		return null;
	}

	return (
		<div className="dash-card p-6 mb-8 mt-4 bg-obsidian-light border border-obsidian-border shadow-md">
			<div className="flex justify-between items-center mb-6">
				<h3 className="dash-title text-lg font-bold text-text-main">
					Platform Macro Trends
				</h3>
			</div>

			<div className="h-[350px] w-full">
				<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
					<LineChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#2a2a2a"
							vertical={false}
						/>
						<XAxis
							dataKey="date"
							stroke="#666"
							tick={{ fill: "#888", fontSize: 12 }}
							tickMargin={10}
							axisLine={false}
							tickLine={false}
						/>
						
						{/* Left Y-Axis for Net New Metrics */}
						<YAxis
							yAxisId="left"
							stroke="#6366F1"
							tick={{ fill: "#6366F1", fontSize: 12 }}
							tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
							tickMargin={10}
							axisLine={false}
							tickLine={false}
						/>
						
						{/* Right Y-Axis for Avg Community Growth */}
						<YAxis
							yAxisId="right"
							orientation="right"
							stroke="#FF4500"
							tick={{ fill: "#FF4500", fontSize: 12 }}
							tickMargin={10}
							axisLine={false}
							tickLine={false}
						/>

						<Tooltip
							contentStyle={{
								backgroundColor: "#1e1e1e",
								border: "1px solid #333",
								borderRadius: "8px",
								color: "#fff",
								boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
							}}
							itemStyle={{ color: "#e0e0e0", fontSize: "14px" }}
							labelStyle={{
								color: "#a0a0a0",
								fontWeight: "bold",
								marginBottom: "4px",
							}}
							formatter={(value: any, name: any) => {
								if (name === "Avg Community Growth") {
									return [value > 0 ? `+${value}` : value, name];
								}
								if (name === "Net New Visitors" || name === "Net New Contributions") {
									return [Number(value).toLocaleString(), name];
								}
								return [Number(value).toLocaleString(), name];
							}}
						/>
						<Legend 
							wrapperStyle={{ paddingTop: "20px" }}
							iconType="circle"
						/>
						
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="Net New Visitors"
							stroke="#6366F1"
							strokeWidth={3}
							dot={false}
							activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
						/>
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="Net New Contributions"
							stroke="#2ECC71"
							strokeWidth={3}
							dot={false}
							activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="Avg Community Growth"
							stroke="#FF4500"
							strokeWidth={3}
							dot={false}
							activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
