import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AggregateTrendCardProps {
	totalVisitors: number;
	growthPercent: number;
	chartData: any[];
}

export function AggregateTrendCard({ totalVisitors, growthPercent, chartData }: AggregateTrendCardProps) {
	const isPositive = growthPercent >= 0;
	
	const formatNumber = (num: number) => {
		if (num >= 1_000_000_000) {
			return (num / 1_000_000_000).toFixed(1) + 'B';
		}
		if (num >= 1_000_000) {
			return (num / 1_000_000).toFixed(1) + 'M';
		}
		if (num >= 1_000) {
			return (num / 1_000).toFixed(1) + 'K';
		}
		return num.toString();
	};

	return (
		<div className="w-full bg-[#161b1d] border border-white/10 rounded-xl overflow-hidden">
			<div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
				<div>
					<h2 className="text-2xl font-bold text-white mb-1">Aggregate Visitor Trend</h2>
					<p className="text-text-muted text-sm font-medium">
						Combined weekly unique visitors across the top 250 tracked subreddits over the last 30 days.
					</p>
				</div>
				<div className="mt-4 md:mt-0 flex items-center space-x-4">
					<span className="text-5xl font-black text-white tracking-tighter">
						{formatNumber(totalVisitors)}
					</span>
					<div className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-sm font-bold ${
						isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
					}`}>
						{isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
						<span>{isPositive ? "+" : ""}{growthPercent.toFixed(1)}%</span>
					</div>
				</div>
			</div>

			<div className="h-[300px] w-full px-4 pb-6">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="colorDecline" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid
							vertical={false}
							stroke="rgba(255,255,255,0.05)"
						/>
						<XAxis
							dataKey="date"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "monospace" }}
							tickMargin={12}
							minTickGap={50}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "#1f2937",
								borderColor: "#374151",
								borderRadius: "8px",
								color: "#fff",
							}}
							itemStyle={{ color: "#fff" }}
							formatter={(value: any) => [`${Number(value).toFixed(2)}%`, "Growth"]}
						/>
						<Area
							type="monotone"
							dataKey="Top 250 Growth"
							stroke={isPositive ? "#10b981" : "#ef4444"}
							strokeWidth={2}
							fillOpacity={1}
							fill={isPositive ? "url(#colorGrowth)" : "url(#colorDecline)"}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
