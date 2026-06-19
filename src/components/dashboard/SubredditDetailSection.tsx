import { getGrowthColorClass, formatGrowth } from "../../lib/utils";
import { Accordion, AccordionItem } from "../Accordion";
import { useNavigate } from "@tanstack/react-router";

interface MetricData {
	id: number;
	subredditId: number;
	name: string;
	category: string;
	subCategory: string;
	monetizationWeight: number;
	arpuExpectation: string | null;
	population: number | null;
	weeklyVisitors: number;
	weeklyContributions: number;
	recordedAt: Date | string;
	growthPercent?: number;
}

interface SubredditDetailSectionProps {
	accordionData: {
		groupName: string;
		avgGrowth: number;
		items: MetricData[];
	}[];
}

export function SubredditDetailSection({ accordionData }: SubredditDetailSectionProps) {
	const navigate = useNavigate();

	return (
		<div className="dash-card overflow-hidden">
			{/* Tier 4: Accordion Metric Table */}
			<div className="px-6 py-4 border-b border-obsidian-border bg-obsidian-light">
				<h2 className="text-lg font-bold text-text-main">
					Aggregated Performance Breakdown
				</h2>
			</div>
			<Accordion>
				{accordionData.length > 0 ? (
					accordionData.map((group) => (
						<AccordionItem
							key={group.groupName}
							title={group.groupName}
							value={formatGrowth(group.avgGrowth)}
							valueClass={getGrowthColorClass(group.avgGrowth)}
						>
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead className="bg-obsidian/30 border-b border-obsidian-border">
										<tr>
											<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
												Subreddit
											</th>
											<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
												Current Visitors
											</th>
											<th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
												Growth
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-obsidian-border/50">
										{group.items.map((row: MetricData) => (
											<tr
												key={row.id}
												onClick={() => navigate({ to: "/r/$subreddit", params: { subreddit: row.name } })}
												className="group cursor-pointer hover:bg-white/5 transition-colors"
											>
												<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white group-hover:text-orangered transition-colors">
													r/{row.name}
												</td>
												<td className="px-4 py-3 whitespace-nowrap text-sm text-text-main text-right font-mono">
													{row.weeklyVisitors.toLocaleString()}
												</td>
												<td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-bold">
													<span
														className={getGrowthColorClass(row.growthPercent || 0)}
													>
														{formatGrowth(row.growthPercent || 0)}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</AccordionItem>
					))
				) : (
					<div className="px-6 py-8 text-center text-sm text-text-muted">
						No Subreddit data available.
					</div>
				)}
			</Accordion>
		</div>
	);
}
