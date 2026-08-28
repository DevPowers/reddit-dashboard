import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface PortfolioChangesProps {
	additions: any[];
	drops: any[];
}

export function PortfolioChanges({ additions, drops }: PortfolioChangesProps) {
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => setIsMounted(true), []);

	if (additions.length === 0 && drops.length === 0) {
		return null;
	}

	const formatNumber = (num: number) => {
		if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
		if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
		return num.toLocaleString();
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
			{/* Additions Panel */}
			<div className="bg-gradient-to-b from-[#161b1d] to-[#121618] border border-white/10 border-t-2 border-t-success/60 rounded-xl p-6 shadow-lg shadow-success/5 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-32 bg-success/5 blur-3xl pointer-events-none" />
				
				<div className="flex items-center gap-3 mb-6 relative z-10">
					<div className="bg-success/15 p-2.5 rounded-xl border border-success/20">
						<ArrowUpRight className="w-5 h-5 text-success" strokeWidth={2.5} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white tracking-tight">Recent Additions</h2>
						<p className="text-xs text-zinc-400 mt-0.5">New communities entering the Top 250</p>
					</div>
				</div>

				{additions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-zinc-500 bg-black/20 rounded-xl border border-white/5">
						<Clock className="w-8 h-8 mb-3 opacity-40" />
						<p className="text-sm font-medium">No new subreddits added recently.</p>
					</div>
				) : (
					<div className="space-y-3 relative z-10">
						{additions.map((sub) => (
							<div key={sub.id} className="group flex justify-between items-center p-4 rounded-xl bg-[#1a2124]/60 hover:bg-[#1a2124] border border-white/5 border-l-4 border-l-success/80 transition-all">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-full bg-success/10 text-success font-bold flex items-center justify-center text-sm border border-success/20">
										{sub.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<p className="text-white font-semibold tracking-wide">r/{sub.name}</p>
										<p className="text-xs text-zinc-400 mt-0.5 min-h-[16px]">
											{isMounted ? `Added ${format(new Date(sub.createdAt), "MMM d, yyyy")}` : (
												<span className="inline-block w-24 h-3 bg-white/10 rounded animate-pulse" />
											)}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-success font-black text-lg tracking-tight">
										{sub.visitors ? formatNumber(sub.visitors) : "N/A"}
									</p>
									<p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Weekly Visitors</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Drops Panel */}
			<div className="bg-gradient-to-b from-[#161b1d] to-[#121618] border border-white/10 border-t-2 border-t-error/60 rounded-xl p-6 shadow-lg shadow-error/5 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-32 bg-error/5 blur-3xl pointer-events-none" />
				
				<div className="flex items-center gap-3 mb-6 relative z-10">
					<div className="bg-error/15 p-2.5 rounded-xl border border-error/20">
						<ArrowDownRight className="w-5 h-5 text-error" strokeWidth={2.5} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white tracking-tight">Recent Drops</h2>
						<p className="text-xs text-zinc-400 mt-0.5">Communities that fell out of the Top 250</p>
					</div>
				</div>

				{drops.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-zinc-500 bg-black/20 rounded-xl border border-white/5">
						<Clock className="w-8 h-8 mb-3 opacity-40" />
						<p className="text-sm font-medium">No subreddits dropped recently.</p>
					</div>
				) : (
					<div className="space-y-3 relative z-10">
						{drops.map((sub) => (
							<div key={sub.id} className="group flex justify-between items-center p-4 rounded-xl bg-[#1a2124]/60 hover:bg-[#1a2124] border border-white/5 border-l-4 border-l-error/80 transition-all">
								<div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
									<div className="w-8 h-8 rounded-full bg-error/10 text-error font-bold flex items-center justify-center text-sm border border-error/20">
										{sub.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<p className="text-zinc-200 font-semibold tracking-wide">r/{sub.name}</p>
										<p className="text-xs text-zinc-400 mt-0.5 min-h-[16px]">
											{isMounted ? (() => {
												const dropDate = sub.droppedAt 
													? new Date(sub.droppedAt) 
													: new Date(sub.lastSeenAt);
												return `Dropped ${format(dropDate, "MMM d, yyyy")}`;
											})() : (
												<span className="inline-block w-24 h-3 bg-white/10 rounded animate-pulse" />
											)}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-error font-black text-lg tracking-tight">
										{sub.visitors ? formatNumber(sub.visitors) : "N/A"}
									</p>
									<p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Final Weekly Visitors</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
