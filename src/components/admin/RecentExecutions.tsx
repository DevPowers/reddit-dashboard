import { formatDuration } from "./AdminKPISection";

export function RecentExecutions({ runs }: { runs: any[] }) {
	if (!runs || runs.length === 0) return null;

	return (
		<div className="bg-obsidian rounded-xl border border-obsidian-border p-6 shadow-md mb-10">
			<h2 className="text-xl font-bold text-text-main mb-4">Recent Executions</h2>
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="border-b border-obsidian-border text-text-muted text-sm uppercase tracking-wider">
							<th className="py-3 px-4">Date</th>
							<th className="py-3 px-4">Status</th>
							<th className="py-3 px-4">Duration</th>
							<th className="py-3 px-4">Error Message</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-obsidian-border">
						{runs.map((run) => {
							const isSuccess = run.status === "success";
							const isRunning = run.status === "running";

							return (
								<tr key={run.id} className="hover:bg-obsidian-border/30 transition-colors">
									<td className="py-3 px-4 text-text-main whitespace-nowrap">
										{run.ranAt ? new Date(run.ranAt).toLocaleString() : "N/A"}
									</td>
									<td className="py-3 px-4">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												isSuccess
													? "bg-success/10 text-success border border-success/20"
													: isRunning
														? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
														: "bg-danger/10 text-danger border border-danger/20"
											}`}
										>
											{isRunning && <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
											{run.status.toUpperCase()}
										</span>
									</td>
									<td className="py-3 px-4 text-text-muted whitespace-nowrap">
										{formatDuration(run.durationMs)}
									</td>
									<td className="py-3 px-4 text-text-main max-w-md break-words text-sm">
										{run.errorMessage ? (
											<span className="text-danger">{run.errorMessage}</span>
										) : (
											<span className="text-text-muted italic">None</span>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
