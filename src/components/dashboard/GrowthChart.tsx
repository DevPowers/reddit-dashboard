import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface GrowthChartProps {
	data: any[];
}

export function GrowthChart({ data }: GrowthChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="bg-surface-main border border-surface-border rounded-xl p-6 shadow-sm min-h-[400px] flex items-center justify-center">
				<p className="text-text-muted">Not enough data to display trend chart.</p>
			</div>
		);
	}

	return (
		<div className="bg-surface-main border border-surface-border rounded-xl p-6 shadow-sm">
			<h3 className="text-lg font-bold text-text-main mb-6">Aggregate Growth Over Time</h3>
			<div className="h-[400px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--color-surface-border)"
							vertical={false}
						/>
						<XAxis
							dataKey="date"
							stroke="var(--color-text-muted)"
							fontSize={12}
							tickMargin={10}
							minTickGap={30}
						/>
						<YAxis
							stroke="var(--color-text-muted)"
							fontSize={12}
							tickFormatter={(value) => `${value}%`}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "var(--color-surface-elevated)",
								borderColor: "var(--color-surface-border)",
								borderRadius: "8px",
								boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
								color: "var(--color-text-main)",
							}}
							itemStyle={{ color: "var(--color-text-main)" }}
							formatter={(value: any) => [`${Number(value).toFixed(2)}%`, "Top 250 Growth"]}
						/>
						<Line
							type="monotone"
							dataKey="Top 250 Growth"
							stroke="var(--color-orangered)"
							strokeWidth={3}
							dot={{ fill: "var(--color-orangered)", r: 4 }}
							activeDot={{ r: 6, strokeWidth: 0 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
