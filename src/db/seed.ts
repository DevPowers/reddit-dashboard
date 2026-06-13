import { TARGET_SUBREDDITS } from "../data/subreddits";
import { db } from "./index";
import { subreddits } from "./schema";

async function seed() {
	console.log("Seeding subreddits from typed TS array...");

	let insertedCount = 0;

	// Insert logic with upsert to avoid duplicate key errors on name
	for (const group of TARGET_SUBREDDITS) {
		for (const sub of group.subreddits) {
			await db
				.insert(subreddits)
				.values({
					name: sub,
					category: group.category,
					subCategory: group.subCategory,
					arpuExpectation: group.arpuExpectation,
					population: group.population,
				})
				.onConflictDoUpdate({
					target: subreddits.name,
					set: {
						category: group.category,
						subCategory: group.subCategory,
						arpuExpectation: group.arpuExpectation,
						population: group.population,
					},
				});
			insertedCount++;
		}
	}

	console.log(`Seed complete! Upserted ${insertedCount} subreddits.`);
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
