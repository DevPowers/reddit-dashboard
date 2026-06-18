import { runScrapeCycle } from "../routes/api/cron/scrape";

async function main() {
    console.log("[CLI] Starting manual/CLI scrape cycle execution...");
    await runScrapeCycle();
    console.log("[CLI] Scrape cycle completed!");
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
