import { db } from "./src/db/index.server";
import { platformHistoricalMetrics } from "./src/db/schema";
import { calculateAndSaveMacroMetrics } from "./src/functions/macro";

async function run() {
    console.log("Wiping corrupted ARPU-weighted snapshots...");
    await db.delete(platformHistoricalMetrics);
    console.log("Deleted old snapshots.");

    console.log("Generating fresh snapshot from current unweighted data...");
    await calculateAndSaveMacroMetrics();
    console.log("Successfully generated pure momentum snapshot.");
}
run();
