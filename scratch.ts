import { db } from "./src/db/index.server";
import { sql } from "drizzle-orm";
async function run() {
    try {
        const res = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_historical_metrics'`);
        console.log(res);
    } catch(e) {
        console.error(e);
    }
}
run();
