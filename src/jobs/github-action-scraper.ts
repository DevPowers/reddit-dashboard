import { config } from "dotenv";
config();

import { runScrapeCycle } from "../routes/api/cron/scrape";
import { logger } from "../lib/logger";
import { db } from "../db/index.server";
import { cronLogs } from "../db/schema";
import { eq } from "drizzle-orm";

// --- Vector A: Graceful OS Shutdown Handlers ---
// Intercept orchestrator terminations (e.g. GitHub Actions timeout or manual Ctrl+C)
// to proactively mark the database row as failed before the process dies.
const handleShutdown = async (signal: string) => {
	logger.warn("CLI", `Received ${signal}. Gracefully shutting down and marking running jobs as failed...`);
	try {
		await db
			.update(cronLogs)
			.set({ status: 'failed', errorMessage: `Process abruptly terminated by ${signal}` })
			.where(eq(cronLogs.status, 'running'));
			
		logger.info("CLI", "Successfully cleaned up database state. Exiting.");
		process.exit(1);
	} catch (e) {
		logger.error("CLI", "Failed to clean up database state during shutdown", e);
		process.exit(1);
	}
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

async function run() {
	logger.info("CLI", "Starting manual/CLI scrape cycle execution...");
	try {
		const result = await runScrapeCycle();
		logger.info("CLI", "Scrape cycle completed successfully.", result);
		process.exit(0);
	} catch (e) {
		logger.error("CLI", "Scrape cycle failed with error:", e);
		process.exit(1);
	}
}

run();
