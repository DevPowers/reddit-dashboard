import { db } from "../db/index.server";
import { cronLogs } from "../db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const logs = await db.select().from(cronLogs).orderBy(desc(cronLogs.ranAt)).limit(10);
  console.log(logs);
  process.exit(0);
}

run();
