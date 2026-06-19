import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAdminData } from "../functions/admin.functions";
import { AdminKPISection } from "../components/admin/AdminKPISection";
import { SubredditTable } from "../components/admin/SubredditTable";

export const Route = createFileRoute("/subreddits")({
	loader: () => getAdminData(),
	staleTime: 60_000,
	component: AdminDashboard,
});

function AdminDashboard() {
	const data = Route.useLoaderData();
	const router = useRouter();

	const isRunning = data.cronStats.lastRun?.status === "running";

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
			<div className="mb-8 border-b border-obsidian-border pb-6">
				<h1 className="text-3xl font-extrabold text-text-main tracking-tight">
					Subreddits
				</h1>
				<p className="text-text-muted text-sm mt-2">
					Manage tracked subreddits and monitor data pipeline execution.
				</p>
			</div>

			<AdminKPISection data={data} />
			
			<SubredditTable subreddits={data.subreddits} />
		</div>
	);
}
