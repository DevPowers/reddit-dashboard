import { getGrowthColorClass, formatGrowth } from "../../lib/utils";
import { Info } from "lucide-react";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
	CartesianGrid,
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
	overallDauEstimate: number;
	overallDauGrowthPercent: number;
	overallNetNewDau: number;
	velocityIndexScore: number;
}

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
	platformHistory?: HistoricalMetric[];
}

const getVelocityColorClass = (velocity: number) => {
	if (velocity >= 8) return "text-emerald-300"; // Exceptional
	if (velocity >= 4) return "text-emerald-400"; // Strong
	if (velocity > 0) return "text-emerald-500"; // Modest
	if (velocity === 0) return "text-text-muted"; // Flat
	if (velocity > -4) return "text-red-400"; // Modest Decline
	return "text-red-500"; // Severe Decline
};

export function PortfolioMetricsSection({
	portfolioMetrics,
	arpuAggregates,
	activeTier,
	setActiveTier,
	platformHistory = [],
}: PortfolioMetricsSectionProps) {
	const [openModal, setOpenModal] = useState<"dau" | "velocity" | null>(null);

	const chartData = useMemo(() => {
		if (!platformHistory) return [];
		const sorted = [...platformHistory].sort(
			(a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
		);
		return sorted.map((row) => ({
			date: format(new Date(row.recordedAt), "MMM dd"),
			"Engagement Index": row.overallDauEstimate,
			"Percent Growth": Number(row.overallDauGrowthPercent.toFixed(2)),
			"Velocity Index": Number(row.velocityIndexScore.toFixed(2)),
		}));
	}, [platformHistory]);

	return (
		<>
			{/* Hero KPI: Overall Portfolio Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<button 
					type="button"
					onClick={() => setOpenModal("dau")}
					className="dash-card p-8 bg-gradient-to-br from-obsidian-light to-obsidian border-orangered/20 shadow-[0_4px_20px_rgba(255,69,0,0.05)] relative group text-left cursor-pointer transition-transform hover:scale-[1.01]"
				>
					<div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
						<div className="absolute top-0 right-0 w-32 h-32 bg-orangered/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					</div>
					<h3 className="dash-title text-base font-semibold text-text-muted mb-1">
						Engagement Index Growth
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
							{portfolioMetrics.overallNetNew > 0 ? "+" : ""}{portfolioMetrics.overallNetNew.toLocaleString()}
						</span>{" "}
						net new estimated daily reach
					</div>
				</button>

				<button
					type="button"
					onClick={() => setOpenModal("velocity")}
					className="dash-card p-8 bg-gradient-to-br from-obsidian-light to-obsidian border-chart-1/20 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative group text-left cursor-pointer transition-transform hover:scale-[1.01]"
				>
					<div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
						<div className="absolute top-0 right-0 w-32 h-32 bg-chart-1/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
					</div>
					<h3 className="dash-title text-base font-semibold text-text-muted mb-1 flex items-center gap-1.5">
						ARPU Velocity Index
						<div className="relative flex items-center group/tooltip">
							<Info size={14} className="text-text-muted opacity-70 hover:opacity-100 transition-opacity" />
							<div className="absolute top-full left-0 mt-2 w-64 p-3 bg-obsidian border border-obsidian-border rounded-md shadow-2xl text-xs text-text-main opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none z-20 text-left font-normal leading-relaxed">
								<div className="font-bold mb-1">Scale: -10 to 10</div>
								<div className="text-text-muted">
									<span className="text-emerald-300">8 to 10 = Exceptional</span><br/>
									<span className="text-emerald-400">4 to 7 = Strong Growth</span><br/>
									<span className="text-emerald-500">1 to 3 = Modest Growth</span><br/>
									<span className="text-text-muted">0 = Flat Growth</span><br/>
									<span className="text-red-400">-1 to -3 = Modest Decline</span><br/>
									<span className="text-red-500">-4 to -10 = Severe Decline</span>
								</div>
								<div className="mt-2 text-[10px] text-text-muted italic opacity-80">
									*Velocity is heavily weighted by ARPU potential.
								</div>
							</div>
						</div>
					</h3>
					<div className="flex items-end gap-3 mt-3">
						<span
							className={`text-5xl font-extrabold tracking-tight transition-colors duration-300 ${getVelocityColorClass(portfolioMetrics.weightedVelocity)}`}
						>
							{portfolioMetrics.weightedVelocity > 0 ? "+" : ""}
							{portfolioMetrics.weightedVelocity.toFixed(1)}
						</span>
					</div>
					<div className="mt-3 text-text-muted text-sm flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-chart-1" />
						Normalized Revenue Momentum Score
					</div>
				</button>
			</div>

			{/* Tier 1: Aggregate ARPU KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "high" ? null : "high")}
					className={`dash-card p-6 border-t-4 border-t-amber-300 text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "high" ? "ring-2 ring-amber-300 bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
						High ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.high)}`}
					>
						{formatGrowth(arpuAggregates.high)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Prev Quarter</p>
				</button>

				<button
					type="button"
					onClick={() =>
						setActiveTier(activeTier === "medium" ? null : "medium")
					}
					className={`dash-card p-6 border-t-4 border-t-slate-400 text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "medium" ? "ring-2 ring-slate-400 bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
						Medium ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.medium)}`}
					>
						{formatGrowth(arpuAggregates.medium)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Prev Quarter</p>
				</button>

				<button
					type="button"
					onClick={() => setActiveTier(activeTier === "low" ? null : "low")}
					className={`dash-card p-6 border-t-4 border-t-amber-700 text-left transition-all hover:-translate-y-1 cursor-pointer ${activeTier === "low" ? "ring-2 ring-amber-700 bg-obsidian-light" : ""}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
						Low ARPU
					</h3>
					<div
						className={`mt-2 dash-value ${getGrowthColorClass(arpuAggregates.low)}`}
					>
						{formatGrowth(arpuAggregates.low)}
					</div>
					<p className="text-xs text-text-muted mt-1">Average Growth vs Prev Quarter</p>
				</button>
			</div>

			{/* Modal Overlay */}
			{openModal && (
				<div 
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setOpenModal(null)}
				>
					<div 
						className="bg-obsidian w-full max-w-3xl rounded-xl border border-obsidian-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-6 border-b border-obsidian-border bg-obsidian-light">
							<h3 className="text-xl font-bold text-white">
								{openModal === "dau" ? "Engagement Index Trend" : "ARPU Velocity Trend"}
							</h3>
							<button 
								onClick={() => setOpenModal(null)}
								className="text-text-muted hover:text-white transition-colors cursor-pointer"
								aria-label="Close modal"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							</button>
						</div>
						<div className="p-6 h-[400px]">
							{chartData.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
									<LineChart
										data={chartData}
										margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
									>
										<CartesianGrid strokeDasharray="3 3" stroke="var(--color-obsidian-border)" vertical={false} />
										<XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
										<YAxis 
											yAxisId="left"
											stroke={openModal === "dau" ? "var(--color-orangered)" : "var(--color-chart-1)"} 
											tick={{ fill: openModal === "dau" ? "var(--color-orangered)" : "var(--color-chart-1)", fontSize: 12 }} 
											tickFormatter={(value) => openModal === "dau" ? `${(value / 1000).toFixed(0)}k` : value.toFixed(1)}
											tickMargin={10} axisLine={false} tickLine={false} 
										/>
										{openModal === "dau" && (
											<YAxis 
												yAxisId="right"
												orientation="right"
												stroke="var(--color-success)" 
												tick={{ fill: "var(--color-success)", fontSize: 12 }} 
												tickFormatter={(value) => `${value}%`}
												tickMargin={10} axisLine={false} tickLine={false} 
											/>
										)}
										<Tooltip
											contentStyle={{ backgroundColor: "var(--color-obsidian-light)", border: "1px solid var(--color-obsidian-border)", borderRadius: "8px", color: "var(--color-text-main)" }}
											itemStyle={{ color: "var(--color-text-main)" }}
										/>
										<Line
											yAxisId="left"
											type="monotone"
											dataKey={openModal === "dau" ? "Engagement Index" : "Velocity Index"}
											stroke={openModal === "dau" ? "var(--color-orangered)" : "var(--color-chart-1)"}
											strokeWidth={3}
											dot={false}
											activeDot={{ r: 6, stroke: "var(--color-text-main)", strokeWidth: 2 }}
										/>
										{openModal === "dau" && (
											<Line
												yAxisId="right"
												type="monotone"
												dataKey="Percent Growth"
												stroke="var(--color-success)"
												strokeWidth={3}
												dot={false}
												activeDot={{ r: 6, stroke: "var(--color-text-main)", strokeWidth: 2 }}
											/>
										)}
									</LineChart>
								</ResponsiveContainer>
							) : (
								<div className="w-full h-full flex items-center justify-center text-text-muted">
									No historical data available yet.
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
