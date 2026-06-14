import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getAdminData } from "../functions/admin.functions";
import { StatCard } from "../components/StatCard";

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

	const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "data_points", direction: "desc" });

	const sortedSubreddits = [...data.subreddits].sort((a: any, b: any) => {
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
			return <ArrowUpDown className="w-3 h-3 ml-1 inline text-[#3B82F6]/50" />;
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3 h-3 ml-1 inline text-[#3B82F6]" />
		) : (
			<ArrowDown className="w-3 h-3 ml-1 inline text-[#3B82F6]" />
		);
	};

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
				<StatCard
					title="Database Health"
					value={data.dbHealth}
					subtitle="PostgreSQL Connection Status"
					iconColor={isHealthy ? "bg-[#10B981]" : "bg-[#EF4444]"}
					borderColor={isHealthy ? "border-t-[#10B981]" : "border-t-[#EF4444]"}
					textColor={isHealthy ? "text-[#10B981]" : "text-[#EF4444]"}
				/>

				<StatCard
					title="Total Scrapes"
					value={
						<>
							{data.cronStats.totalRuns}{" "}
							<span className="text-sm font-normal text-[#94A3B8]">cycles</span>
						</>
					}
					subtitle="Historical ScraperAPI Executions"
					iconColor="bg-[#3B82F6]"
					borderColor="border-t-[#3B82F6]"
					textColor="text-white"
				/>

				<StatCard
					title="Last Execution"
					value={
						isSuccess
							? "Success"
							: isRunning
								? "Running..."
								: lastRunStatus
									? "Failed"
									: "Pending"
					}
					subtitle={
						data.cronStats.lastRun?.errorMessage ||
						(data.cronStats.lastRun?.ranAt
							? new Date(data.cronStats.lastRun.ranAt).toLocaleString()
							: "Awaiting execution")
					}
					iconColor={
						isSuccess
							? "bg-[#10B981]"
							: isRunning
								? "bg-[#3B82F6]"
								: lastRunStatus
									? "bg-[#EF4444]"
									: "bg-[#F59E0B]"
					}
					borderColor={
						isSuccess
							? "border-t-[#10B981]"
							: isRunning
								? "border-t-[#3B82F6]"
								: lastRunStatus
									? "border-t-[#EF4444]"
									: "border-t-[#F59E0B]"
					}
					textColor={
						isSuccess
							? "text-[#10B981]"
							: isRunning
								? "text-[#3B82F6]"
								: lastRunStatus
									? "text-[#EF4444]"
									: "text-[#F59E0B]"
					}
					isPulse={isRunning}
				/>

				<StatCard
					title="Performance"
					value={
						<>
							{formatDuration(data.cronStats.avgDurationMs)}{" "}
							<span className="text-sm font-normal text-[#94A3B8]">avg</span>
						</>
					}
					subtitle={`Last: ${formatDuration(data.cronStats.lastRun?.durationMs)}`}
					iconColor="bg-[#8B5CF6]"
					borderColor="border-t-[#8B5CF6]"
					textColor="text-white"
				/>
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
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("name")}
								>
									Subreddit <SortIcon columnKey="name" />
								</th>
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("category")}
								>
									Category <SortIcon columnKey="category" />
								</th>
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("latest_visitors")}
								>
									Active Visitors <SortIcon columnKey="latest_visitors" />
								</th>
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("latest_contributions")}
								>
									Contributions <SortIcon columnKey="latest_contributions" />
								</th>
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("data_points")}
								>
									Data Points <SortIcon columnKey="data_points" />
								</th>
								<th 
									className="px-6 py-4 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:bg-[#111C1F] transition-colors"
									onClick={() => requestSort("last_updated")}
								>
									Last Updated <SortIcon columnKey="last_updated" />
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#1F3238]">
							{sortedSubreddits.map((sub: any) => (
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
										<span className="font-medium text-[#E2E8F0]">
											{sub.latest_visitors != null ? sub.latest_visitors.toLocaleString() : "—"}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span className="font-medium text-[#E2E8F0]">
											{sub.latest_contributions != null ? sub.latest_contributions.toLocaleString() : "—"}
										</span>
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
