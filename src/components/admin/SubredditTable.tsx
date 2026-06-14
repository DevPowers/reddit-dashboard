import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SubredditTable({ subreddits }: { subreddits: any[] }) {
	const navigate = useNavigate();
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "data_points", direction: "desc" });

	const sortedSubreddits = [...subreddits].sort((a: any, b: any) => {
		if (!sortConfig) return 0;
		const { key, direction } = sortConfig;
		
		let aVal = a[key];
		let bVal = b[key];
		
		if (aVal === null || aVal === undefined) aVal = "";
		if (bVal === null || bVal === undefined) bVal = "";

		if (typeof aVal === "number" && typeof bVal === "number") {
			return direction === "asc" ? aVal - bVal : bVal - aVal;
		}

		if (aVal < bVal) return direction === "asc" ? -1 : 1;
		if (aVal > bVal) return direction === "asc" ? 1 : -1;
		return 0;
	});

	const requestSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const SortIcon = ({ columnKey }: { columnKey: string }) => {
		if (!sortConfig || sortConfig.key !== columnKey) {
			return <ArrowUpDown className="w-3 h-3 ml-1 inline text-blue-500/50" />;
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3 h-3 ml-1 inline text-blue-500" />
		) : (
			<ArrowDown className="w-3 h-3 ml-1 inline text-blue-500" />
		);
	};

	return (
		<div className="dash-card rounded-xl overflow-hidden border border-obsidian-border">
			<div className="bg-obsidian px-6 py-4 border-b border-obsidian-border">
				<h2 className="text-lg font-bold text-white">
					Tracked Subreddits Data Index
				</h2>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-obsidian-light/50 border-b border-obsidian-border">
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("name")}
							>
								Subreddit <SortIcon columnKey="name" />
							</th>
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("category")}
							>
								Category <SortIcon columnKey="category" />
							</th>
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("latest_visitors")}
							>
								Active Visitors <SortIcon columnKey="latest_visitors" />
							</th>
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("latest_contributions")}
							>
								Contributions <SortIcon columnKey="latest_contributions" />
							</th>
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("data_points")}
							>
								Data Points <SortIcon columnKey="data_points" />
							</th>
							<th 
								className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-obsidian-light transition-colors whitespace-nowrap"
								onClick={() => requestSort("last_updated")}
							>
								Last Updated <SortIcon columnKey="last_updated" />
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-obsidian-border">
						{sortedSubreddits.map((sub: any) => (
							<tr
								key={sub.id}
								onClick={() => navigate({ to: "/r/$subreddit", params: { subreddit: sub.name } })}
								className="group cursor-pointer hover:bg-white/5 transition-colors"
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<div 
										className="font-semibold text-white group-hover:text-orangered transition-colors"
									>
										r/{sub.name}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
									{sub.category ? sub.category.replace(/_/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase()) : "—"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm">
									<span className="font-medium text-text-main">
										{sub.latest_visitors != null ? sub.latest_visitors.toLocaleString() : "—"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm">
									<span className="font-medium text-text-main">
										{sub.latest_contributions != null ? sub.latest_contributions.toLocaleString() : "—"}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm">
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
										{sub.data_points} records
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
									{sub.last_updated ? (
										new Date(sub.last_updated).toLocaleString()
									) : (
										<span className="text-yellow-500">Awaiting sync</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{subreddits.length === 0 && (
					<div className="p-8 text-center text-text-muted">
						No subreddits tracked. Ensure targets are configured in
						`subreddits.ts`.
					</div>
				)}
			</div>
		</div>
	);
}
