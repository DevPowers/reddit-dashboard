import { getGrowthColorClass, formatGrowth } from "../../lib/utils";

interface PortfolioMetricsSectionProps {
	portfolioMetrics: {
		overallGrowthPercent: number;
		overallNetNew: number;
		weightedVelocity: number;
	};
	arpuAggregates: {
		high: number;
		medium: number;
		low: number;
	};
	activeTier: "high" | "medium" | "low" | null;
	setActiveTier: (tier: "high" | "medium" | "low" | null) => void;
}

export function PortfolioMetricsSection({
	portfolioMetrics,
	arpuAggregates,
	activeTier,
	setActiveTier,
}: PortfolioMetricsSectionProps) {
	return (
		<>
			{/* Hero KPI: Overall Portfolio Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="dash-card p-8 bg-gradient-to-br from-obsidian-light to-obsidian border-orangered/20 shadow-[0_4px_20px_rgba(255,69,0,0.05)] relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-orangered/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					<h3 className="dash-title text-base font-semibold text-text-muted mb-1">
						Overall DAU Estimated Growth
					</h3>
					<div className="flex items-end gap-3 mt-3">
						<span
							className={`text-5xl font-extrabold tracking-tight ${getGrowthColorClass(portfolioMetrics.overallGrowthPercent)}`}
						>
							{formatGrowth(portfolioMetrics.overallGrowthPercent)}
						</span>
					</div>
					<div className="mt-3 text-text-muted text-sm flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-success" />
						<span className="text-text-main font-medium">
							+{portfolioMetrics.overallNetNew.toLocaleString()}
						</span>{" "}
						net new daily active users
					</div>
				</div>

				<div className="dash-card p-8 bg-gradient-to-br from-obsidian-light to-obsidian border-[#6366F1]/20 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-[#6366F1]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					<h3 className="dash-title text-base font-semibold text-text-muted mb-1">
						DAU ARPU Velocity (Weighted)
					</h3>
					<div className="flex items-end gap-3 mt-3">
						<span
							className={`text-5xl font-extrabold tracking-tight ${portfolioMetrics.weightedVelocity > 0 ? "text-success" : "text-danger"}`}
						>
							{portfolioMetrics.weightedVelocity > 0 ? "+" : ""}
							{(portfolioMetrics.weightedVelocity / 100000).toFixed(1)}
						</span>
					</div>
					<div className="mt-3 text-text-muted text-sm flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
						Normalized Revenue Momentum Score
					</div>
				</div>
			</div>

			{/* Tier 1: Aggregate ARPU KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "high" ? null : "high")}
					className={`dash-card p-6 border-t-4 border-t-[#FCD34D] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "high" ? "ring-2 ring-[#FCD34D] bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]" />
						High ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.high)}`}
					>
						{formatGrowth(arpuAggregates.high)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Q1</p>
				</button>

				<button
					type="button"
					onClick={() =>
						setActiveTier(activeTier === "medium" ? null : "medium")
					}
					className={`dash-card p-6 border-t-4 border-t-[#94A3B8] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "medium" ? "ring-2 ring-[#94A3B8] bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
						Medium ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.medium)}`}
					>
						{formatGrowth(arpuAggregates.medium)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Q1</p>
				</button>

				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "low" ? null : "low")}
					className={`dash-card p-6 border-t-4 border-t-[#B45309] text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "low" ? "ring-2 ring-[#B45309] bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
						Low ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.low)}`}
					>
						{formatGrowth(arpuAggregates.low)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Q1</p>
				</button>
			</div>
		</>
	);
}
