import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { getSubredditMetrics } from "../functions/subreddit.functions";

export const Route = createFileRoute("/r/$subreddit")({
	component: SubredditPage,
	loader: async ({ params }) => {
		return getSubredditMetrics({ data: params.subreddit });
	},
});

function SubredditPage() {
	const { subreddit } = Route.useParams();
	const data = Route.useLoaderData();
	const router = useRouter();

	// Format data and deduplicate by day to only show the latest record per day
	const deduplicatedMetrics = useMemo(() => {
		if (!data.metrics || data.metrics.length === 0) return [];

		const metricsByDay = new Map<string, typeof data.metrics[0]>();
		
		for (const m of data.metrics) {
			const dateStr = new Date(m.recordedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
			// Since data.metrics is ordered by descending recordedAt (newest first),
			// we only set it if it doesn't exist yet, keeping the latest record per day
			if (!metricsByDay.has(dateStr)) {
				metricsByDay.set(dateStr, m);
			}
		}

		return Array.from(metricsByDay.values());
	}, [data.metrics]);

	// Format data for Recharts (reverse to show chronological order left-to-right)
	const chartData = useMemo(() => {
		return [...deduplicatedMetrics].reverse().map((m) => ({
			date: new Date(m.recordedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			visitors: m.weeklyVisitors,
			contributions: m.weeklyContributions,
		}));
	}, [deduplicatedMetrics]);

	return (
		<div 
			className="min-h-[85vh] w-full cursor-pointer"
			onClick={() => router.history.back()}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-white tracking-tight">
					r/<span className="text-orangered">{subreddit}</span>
				</h1>
				<button 
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						router.history.back();
					}}
					className="p-2 text-text-muted hover:text-white hover:bg-obsidian-light rounded-full transition-colors cursor-pointer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				</button>
			</div>

			{/* Cron Logs section moved below chart */}

			<div 
				className="dash-card p-6 h-[500px] cursor-default"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-lg font-bold text-text-main mb-6">Historical Growth Metrics</h2>
				{chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
						<LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#1F3238" vertical={false} />
							<XAxis 
								dataKey="date" 
								stroke="#94A3B8" 
								tick={{ fill: "#94A3B8", fontSize: 12 }} 
								tickMargin={10} 
							/>
							<YAxis 
								yAxisId="left"
								stroke="#94A3B8" 
								tick={{ fill: "#94A3B8", fontSize: 12 }}
								tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
								domain={['auto', 'auto']}
							/>
							<YAxis 
								yAxisId="right"
								orientation="right"
								stroke="#94A3B8" 
								tick={{ fill: "#94A3B8", fontSize: 12 }}
								domain={['auto', 'auto']}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "rgba(11, 20, 22, 0.95)",
									borderColor: "#1F3238",
									borderRadius: "8px",
									color: "#E2E8F0",
									boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
								}}
								itemStyle={{ color: "#E2E8F0" }}
							/>
							<Legend verticalAlign="top" height={36} />
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="visitors"
								name="Weekly Visitors"
								stroke="#FF4500"
								strokeWidth={3}
								dot={false}
								activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="contributions"
								name="Weekly Contributions"
								stroke="#38BDF8"
								strokeWidth={3}
								dot={false}
								activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				) : (
					<div className="flex h-full items-center justify-center text-text-muted">
						No historical data recorded yet for this subreddit.
					</div>
				)}
			</div>

			{data.logs && data.logs.length > 0 && (
				<div 
					className="dash-card p-6 cursor-default mb-6"
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className="text-lg font-bold text-text-main mb-4">Recent Execution Logs</h2>
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="bg-obsidian/30 border-b border-obsidian-border">
								<tr>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Date/Time</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">HTTP</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Provider</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Premium Proxy</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Duration</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Error Message</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-obsidian-border/50">
								{data.logs.map((log) => (
									<tr key={log.id} className="hover:bg-obsidian-border/20 transition-colors">
										<td className="px-4 py-3 whitespace-nowrap text-sm text-text-main">
											{new Date(log.ranAt).toLocaleString()}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm">
											<span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
												{log.status.toUpperCase()}
											</span>
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-text-main">
											{log.httpCode || "—"}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm">
											{log.usedPremium ? (
												<span className="px-2 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning">
													PREMIUM
												</span>
											) : (
												<span className="px-2 py-1 rounded-full text-xs font-bold bg-obsidian border border-obsidian-border text-text-muted">
													STANDARD
												</span>
											)}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm">
											<span className={`px-2 py-1 rounded-full text-xs font-bold ${log.usedPremium ? "bg-warning/10 text-warning" : "bg-obsidian border border-obsidian-border text-text-muted"}`}>
												{log.usedPremium ? "PREMIUM" : "STANDARD"}
											</span>
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-text-main">
											{log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}
										</td>
										<td className="px-4 py-3 text-sm text-text-muted max-w-[200px] truncate" title={log.errorMessage || ""}>
											{log.errorMessage || "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{deduplicatedMetrics && deduplicatedMetrics.length > 0 && (
				<div 
					className="dash-card p-6 cursor-default mb-6"
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className="text-lg font-bold text-text-main mb-4">Raw Data (Last 50 Records)</h2>
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="bg-obsidian/30 border-b border-obsidian-border">
								<tr>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Date/Time</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Weekly Visitors</th>
									<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Weekly Contributions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-obsidian-border">
								{deduplicatedMetrics.slice(0, 50).map((row) => (
									<tr key={row.id} className="hover:bg-obsidian-light/50 transition-colors">
										<td className="px-4 py-3 text-sm text-text-main">
											{new Date(row.recordedAt).toLocaleString(undefined, {
												month: "short",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
											})}
										</td>
										<td className="px-4 py-3 text-sm text-text-main">
											{row.weeklyVisitors.toLocaleString()}
										</td>
										<td className="px-4 py-3 text-sm text-text-main">
											{row.weeklyContributions.toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
		</div>
	);
}
