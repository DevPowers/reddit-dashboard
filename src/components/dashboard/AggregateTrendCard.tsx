import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AggregateTrendCardProps {
	totalVisitors: number;
	growthPercent: number;
	netNewVisitors: number;
	chartData: any[];
}

export function AggregateTrendCard({ totalVisitors, growthPercent, netNewVisitors, chartData }: AggregateTrendCardProps) {
	const isPositive = growthPercent >= 0;
	
	const formatNumber = (num: number) => {
		const absNum = Math.abs(num);
		const sign = num < 0 ? '-' : '';
		if (absNum >= 1_000_000_000) {
			return sign + (absNum / 1_000_000_000).toFixed(1) + 'B';
		}
		if (absNum >= 1_000_000) {
			return sign + (absNum / 1_000_000).toFixed(1) + 'M';
		}
		if (absNum >= 1_000) {
			return sign + (absNum / 1_000).toFixed(1) + 'K';
		}
		return sign + absNum.toString();
	};

	return (
		<div className="w-full bg-[#161b1d] border border-white/10 rounded-xl overflow-hidden">
			<div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
				<div>
					<h2 className="text-2xl font-bold text-white mb-1">Top 250 Weekly Visitors</h2>
					<p className="text-zinc-400 text-sm font-medium">
						Tracking the combined sum of weekly unique visitors across the top 250 subreddits over time.
					</p>
				</div>
				<div className="mt-4 md:mt-0 flex items-center space-x-4">
					<span className="text-5xl font-black text-white tracking-tighter">
						{formatNumber(totalVisitors)}
					</span>
					<div className="flex flex-col space-y-2">
						<div className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-sm font-bold ${
							isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
						}`}>
							{isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
							<span>{isPositive ? "+" : ""}{growthPercent.toFixed(2)}%</span>
						</div>
						<div className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-sm font-bold ${
							isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
						}`}>
							{isPositive ? <TrendingUp className="w-4 h-4 opacity-0" /> : <TrendingDown className="w-4 h-4 opacity-0" />}
							<span>{isPositive && netNewVisitors > 0 ? "+" : ""}{formatNumber(netNewVisitors)}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="h-[300px] w-full px-4 pb-6">
				{chartData.length <= 1 ? (
					<div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-[#161b1d]/50">
						<div className={`w-3 h-3 rounded-full mb-4 shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
						<p className="text-zinc-400 text-sm font-medium">Accumulating Trend Data</p>
						<p className="text-zinc-500 text-xs mt-2 max-w-sm text-center">
							The chart requires at least two days of tracking to plot an aggregate trend line.
							Check back tomorrow!
						</p>
					</div>
				) : (
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
							<YAxis 
								hide 
								domain={[
									(dataMin: number) => dataMin - (dataMin * 0.005), 
									(dataMax: number) => dataMax + (dataMax * 0.005)
								]} 
							/>
							<XAxis
								dataKey="date"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "monospace" }}
								tickMargin={12}
								minTickGap={50}
								padding={{ left: 20, right: 30 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1f2937",
									borderColor: "#374151",
									borderRadius: "8px",
									color: "#fff",
								}}
								itemStyle={{ color: "#fff" }}
								formatter={(value: any) => {
									const num = Number(value);
									let formatted = num.toLocaleString();
									if (num >= 1_000_000_000) formatted = parseFloat((num / 1_000_000_000).toFixed(3)) + 'B';
									else if (num >= 1_000_000) formatted = parseFloat((num / 1_000_000).toFixed(3)) + 'M';
									else if (num >= 1_000) formatted = parseFloat((num / 1_000).toFixed(1)) + 'K';
									return [formatted, "Total Visitors"];
								}}
							/>
							<Area
								type="monotone"
								dataKey="Total Visitors"
								stroke={isPositive ? "#10b981" : "#ef4444"}
								strokeWidth={2}
								fillOpacity={1}
								fill={isPositive ? "url(#colorGrowth)" : "url(#colorDecline)"}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}
