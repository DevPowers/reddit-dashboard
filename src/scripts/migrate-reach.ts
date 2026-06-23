import { db } from "../db/index.server";
import { platformHistoricalMetrics } from "../db/schema";
import { eq } from "drizzle-orm";

async function run() {
	console.log("Starting historical metric migration...");

	const rows = await db.select().from(platformHistoricalMetrics);
	console.log(`Found ${rows.length} rows to migrate.`);

	let updatedCount = 0;

	for (const row of rows) {
		console.log(`Checking row ID ${row.id} - Value: ${row.totalWeeklyReach}`);
		// Just to be ultra-safe, let's only multiply if the value looks like a DAU number 
		// instead of a massive WAU number. Our mock data base is ~1,200,000 DAU. 
		// If it's already over 25,000,000 we probably already migrated it.
		if (row.totalWeeklyReach > 25000000) {
			console.log(`Skipping row ID ${row.id} (already migrated)`);
			continue;
		}

		await db
			.update(platformHistoricalMetrics)
			.set({
				totalWeeklyReach: row.totalWeeklyReach * 7,
				netNewWeeklyReach: row.netNewWeeklyReach * 7,
			})
			.where(eq(platformHistoricalMetrics.id, row.id));

		console.log(`Updated row ID ${row.id}: ${row.totalWeeklyReach} -> ${row.totalWeeklyReach * 7}`);
		updatedCount++;
	}

	console.log(`Migration complete. Updated ${updatedCount} rows.`);
}

run()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	})
	.then(() => {
		process.exit(0);
	});
