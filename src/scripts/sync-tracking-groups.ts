import { db } from "../db/index.server";
import { trackingGroups, subreddits, subredditGroups } from "../db/schema";
import { TARGET_SUBREDDITS } from "../data/subreddits";
import { sql, inArray, notInArray } from "drizzle-orm";

async function run() {
  const groupsToInsert = TARGET_SUBREDDITS.map((group) => ({
		category: group.category,
		subCategory: group.subCategory,
		population: group.population || null,
	}));

	const uniqueSubs = Array.from(
		new Set(TARGET_SUBREDDITS.flatMap((g) => g.subreddits)),
	).map((name) => ({ name }));

	const groupNameToSubsMap = new Map(
		TARGET_SUBREDDITS.map((g) => [g.subCategory, g.subreddits]),
	);

	const expectedGroupSubCategories = new Set(
		TARGET_SUBREDDITS.map((g) => g.subCategory),
	);
	const expectedSubNames = new Set(
		TARGET_SUBREDDITS.flatMap((g) => g.subreddits),
	);

  await db.transaction(async (tx) => {
		const insertedGroups = await tx
			.insert(trackingGroups)
			.values(groupsToInsert)
			.onConflictDoUpdate({
				target: trackingGroups.subCategory,
				set: {
					category: sql`EXCLUDED.category`,
					population: sql`EXCLUDED.population`,
				},
			})
			.returning({ id: trackingGroups.id, subCategory: trackingGroups.subCategory });

		const insertedSubs = await tx
			.insert(subreddits)
			.values(uniqueSubs)
			.onConflictDoUpdate({
				target: subreddits.name,
				set: { name: sql`EXCLUDED.name` },
			})
			.returning({ id: subreddits.id, name: subreddits.name });

		const groupMap = new Map(insertedGroups.map(g => [g.subCategory, g.id]));
		const subMap = new Map(insertedSubs.map(s => [s.name, s.id]));
		const membershipsToInsert = [];

		for (const [subCategory, subNames] of groupNameToSubsMap.entries()) {
			const groupId = groupMap.get(subCategory);
			if (groupId) {
				for (const subName of subNames) {
					const subredditId = subMap.get(subName);
					if (subredditId) {
						membershipsToInsert.push({ subredditId, groupId });
					}
				}
			}
		}

		await tx.delete(subredditGroups);

		if (membershipsToInsert.length > 0) {
			await tx.insert(subredditGroups).values(membershipsToInsert).onConflictDoNothing();
		}

		if (expectedGroupSubCategories.size > 0) {
			await tx
				.delete(trackingGroups)
				.where(
					notInArray(
						trackingGroups.subCategory,
						Array.from(expectedGroupSubCategories),
					),
				);
		}

		if (expectedSubNames.size > 0) {
			const trackedSubs = await tx
				.select({ id: subreddits.id })
				.from(subreddits)
				.where(notInArray(subreddits.name, Array.from(expectedSubNames)));

			if (trackedSubs.length > 0) {
				await tx
					.delete(subredditGroups)
					.where(
						inArray(
							subredditGroups.subredditId,
							trackedSubs.map((s) => s.id),
						),
					);
			}
		}
	});
  
  console.log("Fully synced database tracking groups!");
  
  // Recalculate macro metrics to update the dashboard
  const { calculateAndSaveMacroMetrics } = await import("../functions/macro");
  await calculateAndSaveMacroMetrics();
  console.log("Recalculated macro metrics.");
}
run().catch(console.error).finally(() => process.exit(0));
