import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAdminData } from "../functions/admin.functions";

export const Route = createFileRoute("/admin")({
	loader: () => getAdminData(),
	component: AdminDashboard,
});

function formatDuration(ms: number | null | undefined) {
	if (!ms) return "N/A";
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds}s`;
}

function AdminDashboard() {
	const data = Route.useLoaderData();
	const router = useRouter();

	const isHealthy = data.dbHealth === "Healthy";
	const lastRunStatus = data.cronStats.lastRun?.status;
	const isSuccess = lastRunStatus === "success";
	const isRunning = lastRunStatus === "running";

	useEffect(() => {
		let interval: ReturnType<typeof setInterval>;
		if (isRunning) {
			interval = setInterval(() => {
				router.invalidate();
			}, 15000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isRunning, router]);

	return (
		<div className="page-wrap py-10 max-w-7xl mx-auto px-4">
			{/* Top Bar: Title */}
			<div className="mb-8 border-b border-[#1F3238] pb-6">
				<h1 className="text-3xl font-extrabold text-[#E2E8F0] tracking-tight">
					System Administration
				</h1>
				<p className="text-[#94A3B8] text-sm mt-2">
					Internal health metrics, cron job execution logs, and database
					diagnostics.
				</p>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
				{/* DB Health */}
				<div
					className={`dash-card p-6 border-t-4 text-left transition-all hover:-translate-y-1 ${isHealthy ? "border-t-[#10B981]" : "border-t-[#EF4444]"}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span
							className={`w-2.5 h-2.5 rounded-full ${isHealthy ? "bg-[#10B981]" : "bg-[#EF4444]"}`}
						/>
						Database Health
					</h3>
					<div
						className={`mt-2 text-2xl font-bold tracking-tight ${isHealthy ? "text-[#10B981]" : "text-[#EF4444]"}`}
					>
						{data.dbHealth}
					</div>
					<p className="text-xs text-[#94A3B8] mt-2">
						PostgreSQL Connection Status
					</p>
				</div>

				{/* Total Cron Runs */}
				<div className="dash-card p-6 border-t-4 border-t-[#3B82F6] text-left transition-all hover:-translate-y-1">
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
						Total Scrapes
					</h3>
					<div className="mt-2 text-2xl font-bold text-white tracking-tight">
						{data.cronStats.totalRuns}{" "}
						<span className="text-sm font-normal text-[#94A3B8]">cycles</span>
					</div>
					<p className="text-xs text-[#94A3B8] mt-2">
						Historical ScraperAPI Executions
					</p>
				</div>

				{/* Last Run Status */}
				<div
					className={`dash-card p-6 border-t-4 text-left transition-all hover:-translate-y-1 ${isSuccess ? "border-t-[#10B981]" : isRunning ? "border-t-[#3B82F6]" : lastRunStatus ? "border-t-[#EF4444]" : "border-t-[#F59E0B]"}`}
				>
					<h3 className="dash-title flex items-center gap-2">
						<span
							className={`w-2.5 h-2.5 rounded-full ${isSuccess ? "bg-[#10B981]" : isRunning ? "bg-[#3B82F6] animate-pulse" : lastRunStatus ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`}
						/>
						Last Execution
					</h3>
					<div
						className={`mt-2 text-2xl font-bold tracking-tight ${isSuccess ? "text-[#10B981]" : isRunning ? "text-[#3B82F6]" : lastRunStatus ? "text-[#EF4444]" : "text-[#F59E0B]"}`}
					>
						{isSuccess
							? "Success"
							: isRunning
								? "Running..."
								: lastRunStatus
									? "Failed"
									: "Pending"}
					</div>
					<p
						className="text-xs text-[#94A3B8] mt-2 truncate"
						title={
							data.cronStats.lastRun?.errorMessage ||
							(isRunning ? "Executing..." : "Waiting for first run")
						}
					>
						{data.cronStats.lastRun?.errorMessage ||
							(data.cronStats.lastRun?.ranAt
								? new Date(data.cronStats.lastRun.ranAt).toLocaleString()
								: "Awaiting execution")}
					</p>
				</div>

				{/* Scrape Duration */}
				<div className="dash-card p-6 border-t-4 border-t-[#8B5CF6] text-left transition-all hover:-translate-y-1">
					<h3 className="dash-title flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
						Performance
					</h3>
					<div className="mt-2 text-2xl font-bold text-white tracking-tight">
						{formatDuration(data.cronStats.avgDurationMs)}{" "}
						<span className="text-sm font-normal text-[#94A3B8]">avg</span>
					</div>
					<p className="text-xs text-[#94A3B8] mt-2 truncate">
						Last: {formatDuration(data.cronStats.lastRun?.durationMs)}
					</p>
				</div>
			</div>

			{/* Subreddit Data Table */}
			<div className="dash-card rounded-xl overflow-hidden border border-[#1F3238]">
				<div className="bg-[#111C1F] px-6 py-4 border-b border-[#1F3238]">
					<h2 className="text-lg font-bold text-white">
						Tracked Subreddits Data Index
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-[#0A1012] border-b border-[#1F3238]">
								<th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Subreddit
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Category
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Data Points
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
									Last Updated
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#1F3238]">
							{data.subreddits.map((sub) => (
								<tr
									key={sub.id}
									className="hover:bg-[#111C1F]/50 transition-colors"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="font-semibold text-white">r/{sub.name}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
										{sub.category}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
											{sub.data_points} records
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
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
					{data.subreddits.length === 0 && (
						<div className="p-8 text-center text-[#94A3B8]">
							No subreddits tracked. Ensure targets are configured in
							`subreddits.ts`.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
