import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SubredditSparkline } from "./SubredditSparkline";

interface SubredditIndexProps {
	latestData: any[];
	allData: any[];
}

export function TrackedSubredditsIndex({ latestData, allData }: SubredditIndexProps) {
	const [expandedSub, setExpandedSub] = useState<string | null>(null);

	const sortedData = useMemo(() => {
		return [...latestData].sort((a, b) => b.weeklyVisitors - a.weeklyVisitors);
	}, [latestData]);

	const toggleRow = (subName: string) => {
		setExpandedSub(expandedSub === subName ? null : subName);
	};

	return (
		<div className="bg-surface-main border border-surface-border rounded-xl shadow-sm overflow-hidden">
			<div className="p-6 border-b border-surface-border">
				<h3 className="text-lg font-bold text-text-main">Tracked Subreddits Data Index</h3>
				<p className="text-sm text-text-muted mt-1">Detailed visitor growth across the top 250 communities.</p>
			</div>
			
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-surface-elevated text-text-muted text-xs uppercase tracking-wider">
							<th className="py-3 px-6 font-semibold border-b border-surface-border">Community</th>
							<th className="py-3 px-6 font-semibold border-b border-surface-border text-right">Weekly Visitors</th>
							<th className="py-3 px-6 font-semibold border-b border-surface-border text-right">Growth (vs Baseline)</th>
							<th className="py-3 px-6 font-semibold border-b border-surface-border text-center">Status</th>
							<th className="py-3 px-6 font-semibold border-b border-surface-border w-10"></th>
						</tr>
					</thead>
					<tbody className="text-sm divide-y divide-surface-border">
						{sortedData.map((sub) => {
							const isExpanded = expandedSub === sub.name;
							const isPositive = sub.growthPercent >= 0;
							
							const history = allData
								.filter(d => d.name === sub.name)
								.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

							return (
								<React.Fragment key={sub.name}>
									<tr 
										className="hover:bg-surface-elevated/50 transition-colors cursor-pointer group"
										onClick={() => toggleRow(sub.name)}
									>
										<td className="py-4 px-6 font-medium text-text-main">
											r/{sub.name}
											{!sub.isActive && <span className="ml-2 text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Inactive</span>}
										</td>
										<td className="py-4 px-6 text-right text-text-main font-mono">
											{sub.weeklyVisitors.toLocaleString()}
										</td>
										<td className={`py-4 px-6 text-right font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
											{isPositive ? '+' : ''}{sub.growthPercent?.toFixed(2)}%
										</td>
										<td className="py-4 px-6 text-center">
											<span className="inline-flex items-center justify-center bg-success/10 text-success text-xs font-bold px-2 py-1 rounded-full">
												Active
											</span>
										</td>
										<td className="py-4 px-6 text-right text-text-muted">
											{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
										</td>
									</tr>
									{isExpanded && (
										<tr className="bg-obsidian/50 border-t-0">
											<td colSpan={5} className="py-6 px-6">
												<div className="max-w-4xl mx-auto">
													<h4 className="text-sm font-bold text-text-main mb-4">Visitor Growth Over Time</h4>
													<SubredditSparkline 
														data={history.map(h => ({
															date: format(new Date(h.recordedAt), "MMM dd"),
															weeklyVisitors: h.weeklyVisitors,
														}))}
														dataKey="weeklyVisitors"
														color="var(--color-orangered)"
													/>
													
													<h4 className="text-sm font-bold text-text-main mb-3 mt-8">Raw Data (Last 50 Records)</h4>
													<div className="bg-surface-main rounded-lg border border-surface-border overflow-hidden">
														<table className="w-full text-left text-xs">
															<thead className="bg-surface-elevated border-b border-surface-border text-text-muted uppercase">
																<tr>
																	<th className="py-2 px-4">Date Recorded</th>
																	<th className="py-2 px-4 text-right">Weekly Visitors</th>
																</tr>
															</thead>
															<tbody className="divide-y divide-surface-border">
																{[...history].reverse().slice(0, 50).map((record, i) => (
																	<tr key={i} className="hover:bg-surface-elevated/30">
																		<td className="py-2 px-4 font-mono text-text-muted">
																			{format(new Date(record.recordedAt), "PPp")}
																		</td>
																		<td className="py-2 px-4 text-right font-mono text-text-main">
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
								<td colSpan={5} className="py-8 text-center text-text-muted">
									No subreddit data available.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
