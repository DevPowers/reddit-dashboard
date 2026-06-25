import { db } from "./src/db/index.server";
import { cronLogs } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    await db.update(cronLogs).set({ status: 'failed' }).where(eq(cronLogs.status, 'running'));
    console.log("Cleared stuck cron locks.");
}
run();
