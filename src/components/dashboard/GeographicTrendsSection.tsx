import { Category } from "../../types";
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
import MapChart from "../MapChart";

interface TooltipProps {
	active?: boolean;
	payload?: Array<{ value: number; name: string; color: string }>;
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-obsidian border border-obsidian-border p-4 rounded-md shadow-xl backdrop-blur-md">
				<p className="font-semibold text-text-main mb-2 border-b border-obsidian-border pb-1">
					{label}
				</p>
				{payload.map((entry) => (
					<div
						key={entry.name}
						className="flex items-center gap-2 text-sm mb-1"
					>
						<span
							className="w-2.5 h-2.5 rounded-full"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-text-muted">{entry.name}:</span>
						<span className="font-mono text-text-main font-semibold">
							{entry.value > 0 ? "+" : ""}
							{entry.value}%
						</span>
					</div>
				))}
			</div>
		);
	}
	return null;
};

interface GeographicTrendsSectionProps {

	selectedCategory: Category;
	setSelectedCategory: (cat: Category) => void;
	chartData: {
		dataPoints: any[];
		lines: string[];
	};
	colors: string[];
	accordionData: { groupName: string; avgGrowth: number }[];
}

export function GeographicTrendsSection({
	selectedCategory,
	setSelectedCategory,
	chartData,
	colors,
	accordionData,
}: GeographicTrendsSectionProps) {
	return (
		<>
			{/* Tier 2: Dynamic Map Component */}
			<div className="mb-8 p-4 bg-obsidian/50 border border-obsidian-border rounded-xl flex justify-center">
				<MapChart 
					countryData={selectedCategory === Category.GEOGRAPHY ? accordionData.map(d => ({ name: d.groupName, growth: d.avgGrowth })) : []}
				/>
			</div>

			{/* Tier 3: Main Stage Recharts */}
			<div className="dash-card p-6 mb-8">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-lg font-bold text-text-main">
						Relative Growth Trajectory
					</h2>
					<div className="flex gap-2">
						{Object.values(Category).filter(c => c !== Category.PERSONAL_TRACKING).map((cat) => (
							<button
								type="button"
								key={cat}
								onClick={() => setSelectedCategory(cat as Category)}
								className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
									selectedCategory === cat
										? "bg-orangered text-white border-orangered shadow-[0_0_10px_rgba(255,69,0,0.3)]"
										: "bg-obsidian-light text-text-muted border-obsidian-border hover:border-text-muted"
								}`}
							>
								{cat.replace(/_/g, " ").toUpperCase()}
							</button>
						))}
					</div>
				</div>

				<div className="h-[450px] w-full">
					{chartData.dataPoints.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
							<LineChart
								data={chartData.dataPoints}
								margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#1F3238" /* kept hardcoded if it maps to obsidian-border, or we can use var(--obsidian-border) */
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
									domain={['auto', 'auto']}
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
						<div className="flex items-center justify-center h-full text-text-muted bg-obsidian-light/50 rounded-lg border border-dashed border-obsidian-border">
							No data points found to plot. Toggle Mock Data for preview.
						</div>
					)}
				</div>
			</div>
		</>
	);
}
