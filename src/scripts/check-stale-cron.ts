import { db } from "../db/index.server";
import { cronLogs } from "../db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const latest = await db.select().from(cronLogs).orderBy(desc(cronLogs.ranAt)).limit(5);
  console.log(latest);
}
run().catch(console.error).finally(() => process.exit(0));
