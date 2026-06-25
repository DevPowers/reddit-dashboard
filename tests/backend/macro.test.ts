import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../src/db/schema";
import { calculateAndSaveMacroMetrics } from "../../src/functions/macro";
import { Category } from "../../src/types";

let client: PGlite;
let mockDb: any;

vi.mock("../../src/db/index.server", () => ({
	get db() {
		return mockDb;
	},
}));

describe("Macro Metrics Math Scenarios", () => {
	beforeEach(async () => {
		client = new PGlite();
		mockDb = drizzle(client, { schema });
		await migrate(mockDb, { migrationsFolder: "./drizzle" });

		// Seed a tracking group for our mock subreddits
		await mockDb.insert(schema.trackingGroups).values({
			category: Category.HIGH_VALUE_AD_VERTICALS,
			subCategory: "Gaming",
		});
	});

	afterEach(async () => {
		await client.close();
		vi.restoreAllMocks();
	});

	it("Scenario A: No Data - Should return 0s gracefully without NaN or errors", async () => {
		const result = await calculateAndSaveMacroMetrics();

		expect(result).toBeDefined();
		expect(result.totalWeeklyVisitors).toBe(0);
		expect(result.visitorGrowthPercent).toBe(0);
		expect(result.netNewWeeklyVisitors).toBe(0);
		expect(result.totalWeeklyContributions).toBe(0);
		expect(result.contributionGrowthPercent).toBe(0);
		expect(result.netNewWeeklyContributions).toBe(0);
		expect(result.averageCommunityGrowth).toBe(0);
	});

	it("Scenario B: Single Data Point - Should protect against mathematical dilution", async () => {
		// Insert subreddit
		const [sub] = await mockDb
			.insert(schema.subreddits)
			.values({ name: "investing" })
			.returning();

		await mockDb.insert(schema.subredditGroups).values({
			subredditId: sub.id,
			groupId: 1, // Matches the group inserted in beforeEach
		});

		// Insert exactly ONE metric history record (representing a brand new subreddit)
		await mockDb.insert(schema.metricsHistory).values({
			subredditId: sub.id,
			weeklyVisitors: 7000000, // 1,000,000 DAU
			weeklyContributions: 100,
			recordedAt: new Date("2026-06-18T10:00:00Z"),
		});

		const result = await calculateAndSaveMacroMetrics();

		// Engagement Index (Total Reach) should include the 7,000,000 Reach
		expect(result.totalWeeklyVisitors).toBe(7000000);
		expect(result.totalWeeklyContributions).toBe(100);
		
		// Growth and Velocity MUST remain 0 to prevent dilution spikes!
		expect(result.visitorGrowthPercent).toBe(0);
		expect(result.netNewWeeklyVisitors).toBe(0);
		expect(result.contributionGrowthPercent).toBe(0);
		expect(result.netNewWeeklyContributions).toBe(0);
		expect(result.averageCommunityGrowth).toBe(0);
	});

	it("Scenario C: Multiple Data Points + Single Point - Should accurately calculate actual aged growth", async () => {
		// Insert subreddit with aged growth
		const [sub] = await mockDb
			.insert(schema.subreddits)
			.values({ name: "wallstreetbets" })
			.returning();

		await mockDb.insert(schema.subredditGroups).values({
			subredditId: sub.id,
			groupId: 1,
		});

		// Insert Day 1 (Historical Baseline)
		await mockDb.insert(schema.metricsHistory).values({
			subredditId: sub.id,
			weeklyVisitors: 700000, // 100,000 DAU
			weeklyContributions: 100,
			recordedAt: new Date("2026-06-17T10:00:00Z"),
		});

		// Insert Day 2 (Latest Point) -> 10% Growth
		await mockDb.insert(schema.metricsHistory).values({
			subredditId: sub.id,
			weeklyVisitors: 770000, // 110,000 DAU
			weeklyContributions: 110,
			recordedAt: new Date("2026-06-18T10:00:00Z"),
		});

		// Insert a NEW subreddit with ONLY ONE data point to test dilution isolation
		const [subNew] = await mockDb
			.insert(schema.subreddits)
			.values({ name: "gaming" })
			.returning();

		await mockDb.insert(schema.subredditGroups).values({
			subredditId: subNew.id,
			groupId: 1,
		});

		await mockDb.insert(schema.metricsHistory).values({
			subredditId: subNew.id,
			weeklyVisitors: 7000000, // 1,000,000 DAU
			weeklyContributions: 100,
			recordedAt: new Date("2026-06-18T10:00:00Z"),
		});

		const result = await calculateAndSaveMacroMetrics();

		// Engagement Index should use the absolute latest reach (770k + 7,000k)
		expect(result.totalWeeklyVisitors).toBe(7770000);
		expect(result.totalWeeklyContributions).toBe(210);

		// Growth should STILL accurately measure (770k - 700k) / 700k = 10% despite the new 7M Reach sub
		expect(result.visitorGrowthPercent).toBeCloseTo(10, 1);
		
		// Net new should accurately measure 770k - 700k = 70,000
		expect(result.netNewWeeklyVisitors).toBe(70000);
		
		expect(result.contributionGrowthPercent).toBeCloseTo(10, 1);
		expect(result.netNewWeeklyContributions).toBe(10);

		// Velocity should be positive because growth was positive
		expect(result.averageCommunityGrowth).toBeGreaterThan(0);
	});
});
