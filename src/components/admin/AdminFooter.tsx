import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getAdminData } from "../../functions/admin.functions";

export function AdminFooter() {
	const [isOpen, setIsOpen] = useState(false);
	const [adminData, setAdminData] = useState<any>(null);

	useEffect(() => {
		if (isOpen && !adminData) {
			getAdminData().then(setAdminData);
		}
	}, [isOpen, adminData]);

	return (
		<footer className="mt-12 py-6 text-center">
			<button 
				onClick={() => setIsOpen(true)}
				className="text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer"
			>
				Copyright © 2026. All rights reserved.*
			</button>

			{isOpen && (
				<div className="fixed inset-0 bg-obsidian/80 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
					<div 
						className="bg-surface-main border border-surface-border rounded-xl p-6 max-w-md w-full shadow-lg"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-4 border-b border-surface-border pb-4">
							<h3 className="text-lg font-bold text-text-main">System Diagnostics</h3>
							<button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-main cursor-pointer">
								Close
							</button>
						</div>
						
						{adminData ? (
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<span className="text-text-muted">Database Health:</span>
									<span className={`font-mono font-bold ${adminData.dbHealth === 'Healthy' ? 'text-success' : 'text-error'}`}>
										{adminData.dbHealth}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-text-muted">Days of Data Collected:</span>
									<span className="font-mono text-text-main">
										{adminData.cronStats.totalRuns.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-text-muted">Average Collection Time:</span>
									<span className="font-mono text-text-main">
										{adminData.cronStats.avgDurationMs ? `${(adminData.cronStats.avgDurationMs / 1000).toFixed(1)}s` : 'N/A'}
									</span>
								</div>
								
								<div className="mt-6 pt-4 border-t border-surface-border">
									<h4 className="text-sm font-semibold text-text-main mb-2">Most Recent Collection</h4>
									{adminData.cronStats.recentRun ? (
										<div className="bg-surface-elevated rounded p-3 text-sm">
											<div className="flex justify-between mb-1">
												<span className="text-text-muted">Status:</span>
												<span className={`font-bold ${adminData.cronStats.recentRun.status === 'success' ? 'text-success' : 'text-warning'}`}>
													{adminData.cronStats.recentRun.status.toUpperCase()}
												</span>
											</div>
											<div className="flex justify-between mb-1">
												<span className="text-text-muted">Time:</span>
												<span className="text-text-main">
													{format(new Date(adminData.cronStats.recentRun.ranAt), "MMM dd, yyyy h:mm a")}
												</span>
											</div>
											{adminData.cronStats.recentRun.errorMessage && (
												<div className="mt-2 text-xs text-error bg-error/10 p-2 rounded">
													Error: {adminData.cronStats.recentRun.errorMessage}
												</div>
											)}
										</div>
									) : (
										<p className="text-text-muted text-sm flex items-center justify-center">No data collected yet.</p>
									)}
								</div>
							</div>
						) : (
							<div className="flex justify-center py-8">
								<p className="text-text-muted animate-pulse">Loading diagnostics...</p>
							</div>
						)}
					</div>
				</div>
			)}
		</footer>
	);
}
