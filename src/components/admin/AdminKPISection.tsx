import { StatCard } from "../StatCard";

function formatDuration(ms: number | null | undefined) {
	if (!ms) return "N/A";
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds}s`;
}

export function AdminKPISection({ data }: { data: any }) {
	const isHealthy = data.dbHealth === "Healthy";
	const lastRunStatus = data.cronStats.lastRun?.status;
	const isSuccess = lastRunStatus === "success";
	const isRunning = lastRunStatus === "running";

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
			<StatCard
				title="Database Health"
				value={data.dbHealth}
				subtitle="PostgreSQL Connection Status"
				iconColor={isHealthy ? "bg-success" : "bg-danger"}
				borderColor={isHealthy ? "border-t-success" : "border-t-danger"}
				textColor={isHealthy ? "text-success" : "text-danger"}
			/>

			<StatCard
				title="Total Scrapes"
				value={
					<>
						{data.cronStats.totalRuns}{" "}
						<span className="text-sm font-normal text-text-muted">cycles</span>
					</>
				}
				subtitle="Historical ScraperAPI Executions"
				iconColor="bg-blue-500"
				borderColor="border-t-blue-500"
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
						? "bg-success"
						: isRunning
							? "bg-blue-500"
							: lastRunStatus
								? "bg-danger"
								: "bg-yellow-500"
				}
				borderColor={
					isSuccess
						? "border-t-success"
						: isRunning
							? "border-t-blue-500"
							: lastRunStatus
								? "border-t-danger"
								: "border-t-yellow-500"
				}
				textColor={
					isSuccess
						? "text-success"
						: isRunning
							? "text-blue-500"
							: lastRunStatus
								? "text-danger"
								: "text-yellow-500"
				}
				isPulse={isRunning}
			/>

			<StatCard
				title="Performance"
				value={
					<>
						{formatDuration(data.cronStats.avgDurationMs)}{" "}
						<span className="text-sm font-normal text-text-muted">avg</span>
					</>
				}
				subtitle={`Last: ${formatDuration(data.cronStats.lastRun?.durationMs)}`}
				iconColor="bg-purple-500"
				borderColor="border-t-purple-500"
				textColor="text-white"
			/>
		</div>
	);
}
