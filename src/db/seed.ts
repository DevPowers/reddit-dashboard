import * as dotenv from "dotenv";

dotenv.config();

import { TARGET_SUBREDDITS } from "../data/subreddits";
import { db } from "./index.server";
import { subredditGroups, subreddits, trackingGroups } from "./schema";

async function seed() {
	console.log("Seeding subreddits from typed TS array...");

	let insertedCount = 0;

	// Clear out existing mappings to prevent stale/duplicate group associations
	// if a subreddit is moved to a different category in subreddits.ts
	await db.delete(subredditGroups);

	// Insert logic with upsert to avoid duplicate key errors on name
	for (const group of TARGET_SUBREDDITS) {
		const [insertedGroup] = await db
			.insert(trackingGroups)
			.values({
				category: group.category,
				subCategory: group.subCategory,
				population: group.population,
			})
			.onConflictDoUpdate({
				target: trackingGroups.subCategory,
				set: {
					category: group.category,
					population: group.population,
				},
			})
			.returning({ id: trackingGroups.id });

		const groupId = insertedGroup.id;

		for (const sub of group.subreddits) {
			const [insertedSub] = await db
				.insert(subreddits)
				.values({ name: sub })
				.onConflictDoUpdate({
					target: subreddits.name,
					set: { name: sub },
				})
				.returning({ id: subreddits.id });

			await db
				.insert(subredditGroups)
				.values({
					subredditId: insertedSub.id,
					groupId: groupId,
				})
				.onConflictDoNothing();

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
