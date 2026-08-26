import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface PortfolioChangesProps {
	additions: any[];
	drops: any[];
}

export function PortfolioChanges({ additions, drops }: PortfolioChangesProps) {
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
			<div className="bg-[#161b1d] border border-white/10 rounded-xl p-6">
				<div className="flex items-center gap-2 mb-6">
					<div className="bg-success/10 p-2 rounded-full">
						<ArrowUpRight className="w-5 h-5 text-success" />
					</div>
					<h2 className="text-xl font-bold text-white">Recent Additions</h2>
				</div>

				{additions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-zinc-500">
						<Clock className="w-8 h-8 mb-2 opacity-50" />
						<p className="text-sm">No new subreddits added recently.</p>
					</div>
				) : (
					<div className="space-y-4">
						{additions.map((sub) => (
							<div key={sub.id} className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/5">
								<div>
									<p className="text-white font-medium">{sub.name}</p>
									<p className="text-xs text-zinc-400 mt-1">
										Added {format(new Date(sub.createdAt), "MMM d, yyyy")}
									</p>
								</div>
								<div className="text-right">
									<p className="text-success font-bold text-lg">
										{sub.visitors ? formatNumber(sub.visitors) : "N/A"}
									</p>
									<p className="text-xs text-zinc-500">Weekly Visitors</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Drops Panel */}
			<div className="bg-[#161b1d] border border-white/10 rounded-xl p-6">
				<div className="flex items-center gap-2 mb-6">
					<div className="bg-error/10 p-2 rounded-full">
						<ArrowDownRight className="w-5 h-5 text-error" />
					</div>
					<h2 className="text-xl font-bold text-white">Recent Drops</h2>
				</div>

				{drops.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-zinc-500">
						<Clock className="w-8 h-8 mb-2 opacity-50" />
						<p className="text-sm">No subreddits dropped recently.</p>
					</div>
				) : (
					<div className="space-y-4">
						{drops.map((sub) => (
							<div key={sub.id} className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/5">
								<div>
									<p className="text-zinc-300 font-medium line-through decoration-error/50">{sub.name}</p>
									<p className="text-xs text-zinc-400 mt-1">
										Dropped {format(new Date(sub.lastSeenAt), "MMM d, yyyy")}
									</p>
								</div>
								<div className="text-right opacity-75">
									<p className="text-zinc-300 font-bold text-lg">
										{sub.visitors ? formatNumber(sub.visitors) : "N/A"}
									</p>
									<p className="text-xs text-zinc-500">Final Weekly Visitors</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
