import { db } from "./src/db/index.server";
import { cronLogs } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function run() {
    const logs = await db.select().from(cronLogs).orderBy(desc(cronLogs.ranAt)).limit(5);
    console.log(logs);
}
run();
