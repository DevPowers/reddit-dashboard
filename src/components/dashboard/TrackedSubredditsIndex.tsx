import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { SubredditSparkline } from "./SubredditSparkline";

interface SubredditIndexProps {
	latestData: any[];
	allData: any[];
}

export function TrackedSubredditsIndex({ latestData, allData }: SubredditIndexProps) {
	const [expandedSub, setExpandedSub] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortKey, setSortKey] = useState<"weeklyVisitors" | "growthPercent">("weeklyVisitors");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const sortedData = useMemo(() => {
		return [...latestData]
			.filter(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
			.sort((a, b) => {
				const valA = a[sortKey] || 0;
				const valB = b[sortKey] || 0;
				if (sortOrder === "asc") return valA - valB;
				return valB - valA;
			});
	}, [latestData, searchQuery, sortKey, sortOrder]);

	const toggleSort = (key: "weeklyVisitors" | "growthPercent") => {
		if (sortKey === key) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortKey(key);
			setSortOrder("desc");
		}
	};

	const toggleRow = (subName: string) => {
		setExpandedSub(expandedSub === subName ? null : subName);
	};

	const formatNumber = (num: number) => {
		if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
		if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
		if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
		return num.toString();
	};

	const getAvatarColors = (name: string) => {
		const colors = [
			{ bg: "bg-orange-500/20", text: "text-orange-400" },
			{ bg: "bg-blue-500/20", text: "text-blue-400" },
			{ bg: "bg-emerald-500/20", text: "text-emerald-400" },
			{ bg: "bg-purple-500/20", text: "text-purple-400" },
			{ bg: "bg-pink-500/20", text: "text-pink-400" },
		];
		const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[hash % colors.length];
	};

	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
				<h2 className="text-2xl font-bold text-white tracking-tight">Tracked Subreddits Data Index</h2>
				<div className="relative mt-4 md:mt-0 w-full md:w-64">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
					<input 
						type="text" 
						placeholder="Search subreddits..." 
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-[#161b1d] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-text-muted focus:outline-none focus:border-white/20 transition-colors"
					/>
				</div>
			</div>
			
			<div className="bg-[#161b1d] border border-white/10 rounded-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="text-xs tracking-widest uppercase text-zinc-400 border-b border-white/10">
								<th className="py-4 px-6 font-medium">Subreddit</th>
								<th 
									className="py-4 px-6 font-medium text-right cursor-pointer hover:text-white transition-colors select-none"
									onClick={() => toggleSort("weeklyVisitors")}
								>
									Weekly Visitors {sortKey === "weeklyVisitors" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
								</th>
								<th 
									className="py-4 px-6 font-medium text-right cursor-pointer hover:text-white transition-colors select-none"
									onClick={() => toggleSort("growthPercent")}
								>
									Net Growth {sortKey === "growthPercent" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
								</th>
							</tr>
						</thead>
						<tbody className="text-sm divide-y divide-white/10">
							{sortedData.map((sub) => {
								const isExpanded = expandedSub === sub.name;
								const isPositive = sub.growthPercent >= 0;
								const avatarColors = getAvatarColors(sub.name);
								
								const history = allData
									.filter(d => d.name === sub.name)
									.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

								return (
									<React.Fragment key={sub.name}>
										<tr 
											className="bg-[#161b1d] hover:bg-[#1a2124] transition-colors cursor-pointer group border-l-[3px] border-transparent hover:border-orangered"
											onClick={() => toggleRow(sub.name)}
										>
											<td className="py-4 px-6 font-medium text-white flex items-center space-x-4">
												<div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
													{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
												</div>
												<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors.bg} ${avatarColors.text}`}>
													{sub.name.charAt(0).toUpperCase()}
												</div>
												<span>r/{sub.name}</span>
											</td>
											<td className="py-4 px-6 text-right text-white">
												{formatNumber(sub.weeklyVisitors)}
											</td>
											<td className={`py-4 px-6 text-right font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
												{isPositive ? '+' : ''}{sub.growthPercent?.toFixed(2)}%
											</td>
										</tr>
										{isExpanded && (
											<tr className="bg-[#121618] border-t-0 shadow-inner">
												<td colSpan={3} className="py-6 px-6">
													<div className="max-w-4xl mx-auto">
														<div className="flex justify-between items-end mb-4">
															<div>
																<h4 className="text-sm font-bold text-white mb-1">Visitor Growth Over Time</h4>
																{history.length > 0 && (
																	<p className="text-xs text-zinc-400">
																		Net Change: <span className={isPositive ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{isPositive ? '+' : ''}{sub.growthPercent?.toFixed(2)}%</span> since {format(new Date(history[0].recordedAt), "MMM d, yyyy")}
																	</p>
																)}
															</div>
														</div>
														<SubredditSparkline 
															data={history.map(h => ({
																date: format(new Date(h.recordedAt), "MMM dd"),
																weeklyVisitors: h.weeklyVisitors,
															}))}
															dataKey="weeklyVisitors"
															color={isPositive ? "#10b981" : "#ef4444"}
														/>
														<h4 className="text-sm font-bold text-white mb-3 mt-8">Raw Data (Last 50 Records)</h4>
														<div className="bg-[#161b1d] rounded-lg border border-white/10 overflow-hidden">
															<table className="w-full text-left text-xs">
																<thead className="bg-[#121618] border-b border-white/10 text-text-muted uppercase">
																	<tr>
																		<th className="py-2 px-4">Date Recorded</th>
																		<th className="py-2 px-4 text-right">Weekly Visitors</th>
																	</tr>
																</thead>
																<tbody className="divide-y divide-white/10">
																	{[...history].reverse().slice(0, 50).map((record, i) => (
																		<tr key={i} className="hover:bg-white/5">
																			<td className="py-2 px-4 font-mono text-text-muted">
																				{format(new Date(record.recordedAt), "PPp")}
																			</td>
																			<td className="py-2 px-4 text-right font-mono text-white">
																				{record.weeklyVisitors.toLocaleString()}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								);
							})}
							{sortedData.length === 0 && (
								<tr>
									<td colSpan={3} className="py-12 text-center text-text-muted">
										No subreddits found matching "{searchQuery}".
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
