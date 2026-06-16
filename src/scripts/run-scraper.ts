import { config } from "dotenv";
config();

import { runScrapeCycle } from "../routes/api/cron/scrape";
import { logger } from "../lib/logger";

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
