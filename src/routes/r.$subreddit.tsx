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

	// Format data for Recharts (reverse to show chronological order left-to-right)
	const chartData = useMemo(() => {
		if (!data.metrics || data.metrics.length === 0) return [];

		return [...data.metrics].reverse().map((m) => ({
			date: new Date(m.recordedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			visitors: m.weeklyVisitors,
			contributions: m.weeklyContributions,
		}));
	}, [data.metrics]);

	return (
		<div 
			className="min-h-[85vh] w-full cursor-pointer"
			onClick={() => router.history.back()}
		>
			<div 
				className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 cursor-default"
				onClick={(e) => e.stopPropagation()}
			>
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-white tracking-tight">
					r/<span className="text-orangered">{subreddit}</span>
				</h1>
			</div>

			<div className="dash-card p-6 h-[500px]">
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
							/>
							<YAxis 
								yAxisId="right"
								orientation="right"
								stroke="#94A3B8" 
								tick={{ fill: "#94A3B8", fontSize: 12 }}
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
		</div>
		</div>
	);
}
