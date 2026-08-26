import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface MetricConfig {
	title: string;
	key: string;
	value: string | number;
	dataKey: string;
	isPercentage?: boolean;
	description?: string;
}

interface MacroMetricsGridProps {
	platformHistory: any[];
}

export function MacroMetricsGrid({ platformHistory }: MacroMetricsGridProps) {
	const [activeMetric, setActiveMetric] = useState<MetricConfig | null>(null);

	const latest = platformHistory[platformHistory.length - 1];
	if (!latest) return null;

	const formatNumber = (num: number) => {
		if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
		if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
		if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
		return num.toLocaleString();
	};

	const metrics: MetricConfig[] = [
		{
			title: "Median Visitors",
			key: "medianVisitors",
			dataKey: "Median",
			value: formatNumber(latest.medianVisitors),
			description: "The typical Top 250 subreddit",
		},
		{
			title: "Max Visitors",
			key: "maxVisitors",
			dataKey: "Max",
			value: formatNumber(latest.maxVisitors),
			description: "The #1 largest subreddit volume",
		},
		{
			title: "Min Visitors",
			key: "minVisitors",
			dataKey: "Min",
			value: formatNumber(latest.minVisitors),
			description: "The cutoff to enter the Top 250",
		},
		{
			title: "Top 10 Concentration",
			key: "top10Concentration",
			dataKey: "Concentration",
			value: `${latest.top10Concentration.toFixed(1)}%`,
			isPercentage: true,
			description: "Volume held by the top 10 subs",
		},
	];

	// Prepare chart data mapped dynamically based on active metric
	const chartData = platformHistory.map((snap) => ({
		date: format(new Date(snap.recordedAt), "MMM dd"),
		Median: snap.medianVisitors,
		Max: snap.maxVisitors,
		Min: snap.minVisitors,
		Concentration: snap.top10Concentration,
	}));

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
				{metrics.map((metric) => (
					<div
						key={metric.key}
						onClick={() => setActiveMetric(metric)}
						className="bg-[#161b1d] border border-white/10 rounded-xl p-6 cursor-pointer hover:border-orangered transition-colors group relative"
					>
						<h3 className="text-zinc-400 text-sm font-medium mb-1">{metric.title}</h3>
						<p className="text-3xl font-bold text-white mb-2">{metric.value}</p>
						<p className="text-xs text-zinc-500">{metric.description}</p>
						
						{/* Subtle visual indicator it's clickable */}
						<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
							<svg className="w-4 h-4 text-orangered" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</div>
					</div>
				))}
			</div>

			{/* Custom Modal */}
			{activeMetric && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
					<div 
						className="bg-[#161b1d] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-center p-6 border-b border-white/10">
							<div>
								<h2 className="text-xl font-bold text-white">{activeMetric.title} Trend</h2>
								<p className="text-sm text-zinc-400">{activeMetric.description}</p>
							</div>
							<button 
								onClick={() => setActiveMetric(null)}
								className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						
						<div className="p-6 h-[400px]">
							{chartData.length <= 1 ? (
								<div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-[#121618]">
									<div className="w-3 h-3 rounded-full mb-4 bg-orangered shadow-[0_0_15px_rgba(255,69,0,0.4)]" />
									<p className="text-zinc-400 text-sm font-medium">Accumulating Trend Data</p>
									<p className="text-zinc-500 text-xs mt-2 max-w-sm text-center">
										Check back tomorrow for the first {activeMetric.title.toLowerCase()} trend line.
									</p>
								</div>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<defs>
											<linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#ff4500" stopOpacity={0.3} />
												<stop offset="95%" stopColor="#ff4500" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
										<YAxis hide domain={['dataMin', 'dataMax']} padding={{ top: 20, bottom: 0 }} />
										<XAxis
											dataKey="date"
											axisLine={false}
											tickLine={false}
											tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "monospace" }}
											tickMargin={12}
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
												if (activeMetric.isPercentage) return [`${Number(value).toFixed(1)}%`, activeMetric.dataKey];
												const num = Number(value);
												let formatted = num.toLocaleString();
												if (num >= 1_000_000_000) formatted = parseFloat((num / 1_000_000_000).toFixed(3)) + 'B';
												else if (num >= 1_000_000) formatted = parseFloat((num / 1_000_000).toFixed(3)) + 'M';
												else if (num >= 1_000) formatted = parseFloat((num / 1_000).toFixed(1)) + 'K';
												return [formatted, activeMetric.dataKey];
											}}
										/>
										<Area
											type="monotone"
											dataKey={activeMetric.dataKey}
											stroke="#ff4500"
											strokeWidth={2}
											fillOpacity={1}
											fill="url(#colorMetric)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</div>
					</div>
					
					{/* Click outside to close overlay */}
					<div 
						className="absolute inset-0 z-[-1] cursor-pointer" 
						onClick={() => setActiveMetric(null)} 
					/>
				</div>
			)}
		</>
	);
}
