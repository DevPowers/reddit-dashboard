import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeHandler } from '../../src/routes/api/cron/scrape';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../src/db/schema';
import { subreddits, metricsHistory } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

// We need to mock the exported `db` from `src/db/index` to point to our in-memory PGLite instance.
let client: PGlite;
let mockDb: any;

vi.mock('../../src/db/index', () => ({
	get db() {
		return mockDb;
	}
}));

describe('Cron Job Idempotency & API Integration', () => {
	beforeEach(async () => {
		// Start an in-memory instance
		client = new PGlite();
		mockDb = drizzle(client, { schema });
		// Run drizzle migrations on the in-memory db
		await migrate(mockDb, { migrationsFolder: './drizzle' });
	});

	afterEach(async () => {
		await client.close();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('Scenario 1 - Fresh Run: Should insert data for all subreddits when no history exists', async () => {
		console.log("Scenario 1 starting...");
		vi.stubEnv('SCRAPER_API_KEY', 'fake_key');
		vi.stubEnv('CRON_SECRET', 'test_secret');
		vi.stubEnv('SCRAPE_INTERVAL_DAYS', '3');

		// We need to mock `fetch` to ScraperAPI so we don't actually hit the network in tests
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			text: async () => `
				<html>
					<body>
						<shreddit-subreddit-header weekly-active-users="1500" weekly-contributions="40"></shreddit-subreddit-header>
					</body>
				</html>
			`
		}));

		console.log("Mocked fetch.");

		const mockRequest = new Request('http://localhost/api/cron/scrape', {
			headers: { 'Authorization': 'Bearer test_secret' }
		});

		console.log("Calling handler...");
		const response = await scrapeHandler({ request: mockRequest });
		console.log("Handler finished with status:", response.status);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.message).toBe('Scraping cycle completed.');

		// Since our TARGET_SUBREDDITS currently has 11 subreddits in subreddits.json
		// We expect 11 subreddits to be inserted and scraped.
		const insertedHistory = await mockDb.select().from(metricsHistory);
		expect(insertedHistory.length).toBeGreaterThan(0);
		expect(insertedHistory[0].weeklyVisitors).toBe(1500);
	}, 60000);

	it('Scenario 2 - Partial Idempotency: Should skip subreddits that have been scraped recently within the wiggle room', async () => {
		vi.stubEnv('SCRAPER_API_KEY', 'fake_key');
		vi.stubEnv('CRON_SECRET', 'test_secret');
		vi.stubEnv('SCRAPE_INTERVAL_DAYS', '3'); // Interval is 72 hours. Cutoff is 60 hours ago.

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			text: async () => `<shreddit-subreddit-header weekly-active-users="2000" weekly-contributions="50"></shreddit-subreddit-header>`
		}));

		// 1. Manually sync the target subreddits first to populate the DB with the subreddit ids
		const syncRequest = new Request('http://localhost/api/cron/scrape', {
			headers: { 'Authorization': 'Bearer test_secret' }
		});
		await scrapeHandler({ request: syncRequest });

		// 2. Clear out the metrics history so we have a fresh slate
		await mockDb.delete(metricsHistory);

		// 3. Find the ID for r/mexico
		const allSubs = await mockDb.select().from(subreddits);
		const mexicoSub = allSubs.find((s: any) => s.name === 'mexico');
		expect(mexicoSub).toBeDefined();

		// 4. Insert a fake history entry for r/mexico dated exactly 2 hours ago (well within the 60 hour cutoff)
		const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
		await mockDb.insert(metricsHistory).values({
			subredditId: mexicoSub.id,
			weeklyVisitors: 9999, // Fake specific number to trace
			weeklyContributions: 10,
			recordedAt: twoHoursAgo
		});

		// 5. Trigger the cron job again
		const partialRequest = new Request('http://localhost/api/cron/scrape', {
			headers: { 'Authorization': 'Bearer test_secret' }
		});
		const partialResponse = await scrapeHandler({ request: partialRequest });
		expect(partialResponse.status).toBe(200);

		// 6. Verify that r/mexico was SKIPPED by ensuring its metrics are still 9999 and there's only 1 record for it
		const mexicoHistory = await mockDb.select().from(metricsHistory).where(eq(metricsHistory.subredditId, mexicoSub.id));
		expect(mexicoHistory.length).toBe(1); // It shouldn't have added a second record!
		expect(mexicoHistory[0].weeklyVisitors).toBe(9999);

		// 7. Check that other subs WERE scraped (they should have 2000 visitors from our mock fetch)
		const otherSub = allSubs.find((s: any) => s.name !== 'mexico');
		const otherHistory = await mockDb.select().from(metricsHistory).where(eq(metricsHistory.subredditId, otherSub.id));
		expect(otherHistory.length).toBe(1);
		expect(otherHistory[0].weeklyVisitors).toBe(2000); // Scraped!
	}, 60000);

	it('Scenario 3 - Full Interval Bypass: Should perform 0 api calls if all subreddits were scraped 1 day ago', async () => {
		vi.stubEnv('SCRAPER_API_KEY', 'fake_key');
		vi.stubEnv('CRON_SECRET', 'test_secret');
		vi.stubEnv('SCRAPE_INTERVAL_DAYS', '3'); // Cutoff 60 hours ago

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			text: async () => `<shreddit-subreddit-header></shreddit-subreddit-header>`
		}));

		const req = new Request('http://localhost/api/cron/scrape', { headers: { 'Authorization': 'Bearer test_secret' } });
		
		// 1. Let the first run sync subreddits
		await scrapeHandler({ request: req });
		
		// 2. Set all metrics history recordedAt to 1 day ago (24 hours ago)
		// 24 hours ago is greater than the 60 hours ago cutoff, so they should ALL be considered "recently scraped"
		const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
		
		// Drizzle ORM doesn't easily let us update recordedAt for all if there are timezone quirks,
		// but we can manually wipe and insert them via raw sql if needed, or simply let drizzle update them all.
		await client.query("UPDATE metrics_history SET recorded_at = $1", [oneDayAgo]);

		// Reset our mock fetch counter
		vi.mocked(global.fetch).mockClear();

		// 3. Trigger again
		await scrapeHandler({ request: req });

		// 4. Verify 0 fetch calls were made because the interval logic filtered out all subreddits
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(0);
	}, 15000);
});
