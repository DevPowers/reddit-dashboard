import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { eq, asc, sql, and, lt } from "drizzle-orm";
import { db } from "../../../db/index.server";
import {
	cronLogs,
	metricsHistory,
	subreddits,
	scraperKeys,
} from "../../../db/schema";
import { logger } from "../../../lib/logger";
import { calculateAndSaveMacroMetrics } from "../../../functions/macro";
import { getEasternTimeISO } from "../../../lib/calculations";

export const runScrapeCycle = async () => {

	// Extract available keys from env
	const envKeys = [
		process.env.SCRAPER_API_KEY_1,
		process.env.SCRAPER_API_KEY_2,
		process.env.SCRAPER_API_KEY_3,
		process.env.SCRAPER_API_KEY_4,
	].filter(Boolean) as string[];

	if (envKeys.length === 0) {
		logger.error("Cron", "Missing SCRAPER_API_KEY_X environment variables.");
		throw new Error("Missing SCRAPER_API_KEY_X environment variables.");
	}
	
	// Self-Healing
	const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
	await db
		.update(cronLogs)
		.set({ status: "failed", errorMessage: "Process abruptly killed/timeout", durationMs: 0 })
		.where(
			and(
				eq(cronLogs.status, "running"),
				lt(cronLogs.ranAt, twoHoursAgo)
			)
		);

	const runningJobs = await db
		.select()
		.from(cronLogs)
		.where(eq(cronLogs.status, "running"));

	if (runningJobs.length > 0) {
		logger.warn("Cron", "A scrape job is already running. Aborting concurrent execution.");
		return new Response(JSON.stringify({ error: "Scrape job already running" }), { status: 409 });
	}

	const [log] = await db
		.insert(cronLogs)
		.values({ status: "running", ranAt: sql`${getEasternTimeISO()}` })
		.returning();

	const startTime = Date.now();
	logger.info("Cron", "Starting scrape cycle for explore/most_visited...");

	try {
		const exhaustedKeyIds = new Set<number>();
		let keysInDb = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
		
		if (keysInDb.length < envKeys.length) {
			logger.info("Cron", `Seeding new API keys into database.`);
			for (let i = keysInDb.length; i < envKeys.length; i++) {
				await db.insert(scraperKeys).values({
					keyIndex: i + 1,
					isActive: keysInDb.length === 0 && i === 0,
				});
			}
			keysInDb = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
		}

		let activeKeyRow = keysInDb.find(k => k.isActive);

		if (!activeKeyRow) {
			await db.update(scraperKeys).set({ isActive: false }).where(eq(scraperKeys.isActive, true));
			activeKeyRow = keysInDb[0];
			await db.update(scraperKeys).set({ isActive: true }).where(eq(scraperKeys.id, activeKeyRow.id));
		}

		let currentKeyString = envKeys[activeKeyRow.keyIndex - 1];
		let currentKeyRowId = activeKeyRow.id;
		
		const fetchWithTimeout = async (url: string, ms: number) => {
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), ms);
			try {
				const response = await fetch(url, { signal: controller.signal });
				clearTimeout(id);
				return response;
			} catch (e: any) {
				clearTimeout(id);
				return { ok: false, status: 408, statusText: "Request Timeout" } as Response;
			}
		};

		let response;
		let attemptNum = 1;
		const targetUrl = "https://www.reddit.com/explore/most_visited/";
		
		while (true) {
			const scraperUrl = `https://api.scraperapi.com/?api_key=${currentKeyString}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true`;

			logger.info("Cron", `[Attempt ${attemptNum}] Now trying to scrape explore/most_visited using ScraperAPI Premium (Key Index ${activeKeyRow!.keyIndex})...`);

			await db.update(scraperKeys).set({ lastAttemptAt: new Date() }).where(eq(scraperKeys.id, currentKeyRowId));
			response = await fetchWithTimeout(scraperUrl, 60000);

			if (response.ok) break;

			logger.warn("Cron", `[Attempt ${attemptNum}] Failed to scrape. Reason: Status Code ${response.status} (${response.statusText || 'Unknown Error'})`);

			if (response.status === 429 || response.status === 403) {
				exhaustedKeyIds.add(currentKeyRowId);
				await db.update(scraperKeys).set({ lastErrorAt: new Date(), lastStatus: "failed" }).where(eq(scraperKeys.id, currentKeyRowId));

				const allKeys = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
				const availableKeys = allKeys.filter(k => !exhaustedKeyIds.has(k.id));

				if (availableKeys.length === 0) {
					const errMsg = "Data keys exhausted.";
					logger.error("Cron", errMsg);

					await db.update(cronLogs).set({
						status: "failed",
						errorMessage: errMsg,
						durationMs: Date.now() - startTime,
					}).where(eq(cronLogs.id, log.id));

					return { message: "Scraping cycle aborted: " + errMsg, results: [] };
				}

				const currentIndex = allKeys.findIndex(k => k.id === currentKeyRowId);
				let nextIndex = (currentIndex + 1) % allKeys.length;
				while (exhaustedKeyIds.has(allKeys[nextIndex].id)) {
					nextIndex = (nextIndex + 1) % allKeys.length;
				}
				const fallbackKeyRow = allKeys[nextIndex];

				logger.info("Cron", `Rotating to fallback key index ${fallbackKeyRow.keyIndex}`);
				await db.update(scraperKeys).set({ isActive: false }).where(eq(scraperKeys.isActive, true));
				await db.update(scraperKeys).set({ isActive: true }).where(eq(scraperKeys.id, fallbackKeyRow.id));

				activeKeyRow = fallbackKeyRow;
				currentKeyRowId = fallbackKeyRow.id;
				currentKeyString = envKeys[fallbackKeyRow.keyIndex - 1];
				attemptNum++;
				continue;
			}

			// Non-auth error
			break;
		}

		if (!response.ok) {
			const msg = `Failed to fetch from proxy. Status: ${response.status}`;
			await db.update(cronLogs).set({
				status: "failed",
				errorMessage: msg,
				durationMs: Date.now() - startTime,
			}).where(eq(cronLogs.id, log.id));
			return { message: msg, results: [] };
		}

		await db.update(scraperKeys).set({ lastStatus: "success" }).where(eq(scraperKeys.id, currentKeyRowId));
		const html = await response.text();
		const $ = cheerio.load(html);

		const parsedSubreddits: { name: string, weeklyVisitors: number }[] = [];
		
		$('.flex.flex-col.flex-1.px-xs').each((_, el) => {
			const name = $(el).find('h4').text().trim();
			const visitorsStr = $(el).find('faceplate-number').attr('number');
			
			if (name && visitorsStr) {
				const weeklyVisitors = parseInt(visitorsStr, 10);
				if (!isNaN(weeklyVisitors)) {
					parsedSubreddits.push({ name, weeklyVisitors });
				}
			}
		});

		if (parsedSubreddits.length === 0) {
			const msg = "DOM parse failed or zero subreddits found.";
			await db.update(cronLogs).set({
				status: "failed",
				errorMessage: msg,
				durationMs: Date.now() - startTime,
			}).where(eq(cronLogs.id, log.id));
			return { message: msg, results: [] };
		}

		logger.info("Cron", `Successfully parsed ${parsedSubreddits.length} subreddits from explore/most_visited.`);

		// 1. Reset all active subreddits to inactive
		await db.update(subreddits).set({ isActive: false });

		const currentTime = sql`${getEasternTimeISO()}`;

		// 2. Upsert the 250 subreddits and mark active
		for (const sub of parsedSubreddits) {
			const inserted = await db.insert(subreddits).values({
				name: sub.name,
				isActive: true,
				consecutiveFailures: 0,
			}).onConflictDoUpdate({
				target: subreddits.name,
				set: { isActive: true, consecutiveFailures: 0 }
			}).returning({ id: subreddits.id });
			
			const dbId = inserted[0].id;
			
			// 3. Insert into metricsHistory
			await db.insert(metricsHistory).values({
				subredditId: dbId,
				weeklyVisitors: sub.weeklyVisitors,
				recordedAt: currentTime,
			});
		}

		await db
			.update(cronLogs)
			.set({
				status: "success",
				errorMessage: null,
				durationMs: Date.now() - startTime,
			})
			.where(eq(cronLogs.id, log.id));

		try {
			await calculateAndSaveMacroMetrics();
			logger.info("Cron", "Daily macro metrics snapshot calculated and saved.");
		} catch (macroErr: any) {
			logger.error("Cron", "Failed to calculate daily macro metrics", macroErr);
		}

		return {
			message: "Scraping cycle completed successfully.",
			results: parsedSubreddits.length,
		};
	} catch (e: any) {
		logger.error("Cron", "Critical error in scrape handler", e);
		await db
			.update(cronLogs)
			.set({
				status: "failed",
				errorMessage: e.message || "Unknown error",
				durationMs: Date.now() - startTime,
			})
			.where(eq(cronLogs.id, log.id));
		throw e;
	}
};

export const scrapeHandler = async ({ request }: { request: Request }) => {
	const CRON_SECRET = process.env.CRON_SECRET;

	if (!CRON_SECRET) {
		logger.error("Cron", "Missing CRON_SECRET environment variable. Aborting to prevent unauthorized access.");
		return Response.json({ error: "Server Configuration Error" }, { status: 500 });
	}

	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const results = await runScrapeCycle();
		return Response.json(results);
	} catch (e: any) {
		return Response.json({ error: e.message }, { status: 500 });
	}
};

export const Route = createFileRoute("/api/cron/scrape")({
	server: {
		handlers: {
			GET: scrapeHandler,
		},
	},
});
