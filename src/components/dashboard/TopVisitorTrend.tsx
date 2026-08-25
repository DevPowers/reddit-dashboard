import { TrendingDown, TrendingUp } from "lucide-react";

interface TopVisitorTrendProps {
	metrics: {
		visitorGrowthPercent: number;
		netNewVisitors: number;
	};
}

export function TopVisitorTrend({ metrics }: TopVisitorTrendProps) {
	const isPositive = metrics.visitorGrowthPercent >= 0;

	return (
		<div className="w-full bg-surface-main border border-surface-border rounded-xl p-8 shadow-sm text-center">
			<h2 className="text-text-muted text-sm uppercase tracking-wider font-semibold mb-2">
				Weekly Visitor Trend (Top 250)
			</h2>
			<div className="flex flex-col items-center justify-center">
				<div className="flex items-center space-x-3 mb-2">
					<span
						className={`text-6xl font-black tracking-tighter ${
							isPositive ? "text-success" : "text-error"
						}`}
					>
						{isPositive ? "+" : ""}
						{metrics.visitorGrowthPercent.toFixed(2)}%
					</span>
					{isPositive ? (
						<TrendingUp className="w-12 h-12 text-success" />
					) : (
						<TrendingDown className="w-12 h-12 text-error" />
					)}
				</div>
				<p className="text-text-muted font-medium text-lg">
					{isPositive ? "+" : ""}
					{metrics.netNewVisitors.toLocaleString()} net new weekly visitors
				</p>
			</div>
		</div>
	);
}
