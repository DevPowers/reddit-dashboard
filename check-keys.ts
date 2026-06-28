import { db } from "./src/db/index.server";
import { scraperKeys } from "./src/db/schema";

async function run() {
    const keys = await db.select().from(scraperKeys);
    console.log(keys);
    process.exit(0);
}
run();
