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

	const sortedData = useMemo(() => {
		return [...latestData]
			.filter(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
			.sort((a, b) => b.weeklyVisitors - a.weeklyVisitors);
	}, [latestData, searchQuery]);

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
						className="w-full bg-[#161b1d] border border-surface-border rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-text-muted focus:outline-none focus:border-text-muted transition-colors"
					/>
				</div>
			</div>
			
			<div className="bg-[#161b1d] border border-surface-border rounded-xl shadow-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="text-xs font-mono tracking-widest uppercase text-text-muted border-b border-surface-border">
								<th className="py-4 px-6 font-medium">Subreddit</th>
								<th className="py-4 px-6 font-medium text-center">Daily Avg</th>
								<th className="py-4 px-6 font-medium text-center">30D Growth</th>
								<th className="py-4 px-6 font-medium text-right">Status</th>
							</tr>
						</thead>
						<tbody className="text-sm divide-y divide-surface-border">
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
											className="hover:bg-[#1a2124] transition-colors cursor-pointer group"
											onClick={() => toggleRow(sub.name)}
										>
											<td className="py-4 px-6 font-medium text-white flex items-center space-x-4">
												<div className="text-text-muted">
													{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
												</div>
												<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors.bg} ${avatarColors.text}`}>
													{sub.name.charAt(0).toUpperCase()}
												</div>
												<span>r/{sub.name}</span>
											</td>
											<td className="py-4 px-6 text-center text-white font-mono">
												{formatNumber(sub.weeklyVisitors / 7)}
											</td>
											<td className={`py-4 px-6 text-center font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
												{isPositive ? '+' : ''}{sub.growthPercent?.toFixed(1)}%
											</td>
											<td className="py-4 px-6 text-right">
												<span className={`inline-flex items-center justify-center text-xs font-bold px-3 py-1 rounded-full ${
													sub.isActive 
													? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
													: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
												}`}>
													{sub.isActive ? 'Active' : 'Stale'}
												</span>
											</td>
										</tr>
										{isExpanded && (
											<tr className="bg-[#121618] border-t-0 shadow-inner">
												<td colSpan={4} className="py-6 px-6">
													<div className="max-w-4xl mx-auto">
														<h4 className="text-sm font-bold text-white mb-4">Visitor Growth Over Time</h4>
														<SubredditSparkline 
															data={history.map(h => ({
																date: format(new Date(h.recordedAt), "MMM dd"),
																weeklyVisitors: h.weeklyVisitors,
															}))}
															dataKey="weeklyVisitors"
															color={isPositive ? "#10b981" : "#ef4444"}
														/>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								);
							})}
							{sortedData.length === 0 && (
								<tr>
									<td colSpan={4} className="py-12 text-center text-text-muted">
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
