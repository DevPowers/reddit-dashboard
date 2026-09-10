import { logger } from "../lib/logger";
import { db } from "../db/index.server";
import { subreddits, metricsHistory, cronLogs, rawScraperResponses } from "../db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { getEasternTimeISO } from "../lib/calculations";
import { calculateAndSaveMacroMetrics } from "../functions/macro";

puppeteer.use(StealthPlugin());

export async function runPuppeteerScrapeCycle() {
	const startTime = Date.now();

	// Self-Healing
	const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
	await db
		.update(cronLogs)
		.set({ status: "failed", errorMessage: "Process abruptly killed/timeout", durationMs: 0 })
		.where(
			and(
				eq(cronLogs.status, "running"),
				sql`${cronLogs.ranAt} < ${twoHoursAgo.toISOString()}` // Simplified for Date comp
			)
		);

	const runningJobs = await db
		.select()
		.from(cronLogs)
		.where(eq(cronLogs.status, "running"));

	if (runningJobs.length > 0) {
		logger.warn("Cron", "A scrape job is already running. Aborting concurrent execution.");
		return { message: "Scrape job already running", results: [] };
	}

	// 1-Run-Per-Day Limit (Deduplication) based on Eastern Time
	const currentIso = getEasternTimeISO();
	const todayStart = new Date(currentIso.split("T")[0] + "T00:00:00" + currentIso.slice(-6));

	const successfulJobsToday = await db
		.select()
		.from(cronLogs)
		.where(
			and(
				eq(cronLogs.status, "success"),
				sql`${cronLogs.ranAt} >= ${todayStart.toISOString()}`
			)
		);

	if (successfulJobsToday.length > 0) {
		logger.info("Cron", "A successful scrape was already completed today. Aborting to prevent duplicate scrapes.");
		return { message: "Already scraped today successfully.", results: [] };
	}

	logger.info("Cron", "Starting Puppeteer stealth scrape cycle for explore/most_visited...");

	// 1. Create a "running" log entry
	const [log] = await db
		.insert(cronLogs)
		.values({
			status: "running",
			errorMessage: null,
			durationMs: 0,
			ranAt: sql`${getEasternTimeISO()}`,
		})
		.returning({ id: cronLogs.id });

	const targetUrl = "https://www.reddit.com/explore/most_visited/";
	let html = "";
	let parsedSubreddits: { name: string, weeklyVisitors: number }[] = [];

	const cookieString = process.env.REDDIT_SESSION_KEY;
	if (!cookieString) {
		const msg = "Missing REDDIT_SESSION_KEY in environment variables.";
		logger.error("Cron", msg);
		await db.update(cronLogs).set({ status: "failed", errorMessage: msg, durationMs: Date.now() - startTime }).where(eq(cronLogs.id, log.id));
		return { message: msg, results: [] };
	}

	try {
		logger.info("Cron", "Launching headless browser...");
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
		
		const page = await browser.newPage();
		
		logger.info("Cron", "Injecting Reddit session cookie...");
		await page.setCookie({
			name: 'reddit_session',
			value: cookieString,
			domain: '.reddit.com',
			path: '/'
		});

		logger.info("Cron", "Navigating to Reddit...");
		const response = await page.goto(targetUrl, { waitUntil: 'networkidle2' });
		
		if (!response || !response.ok()) {
			const status = response ? response.status() : 'Unknown';
			logger.warn("Cron", `Puppeteer navigation failed or returned non-200. Status: ${status}`);
		}
		
		html = await page.content();
		await browser.close();

		logger.info("Cron", "Successfully retrieved HTML from Reddit. Parsing...");
		
		const $ = cheerio.load(html);
		
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
			logger.warn("Cron", "DOM parse failed or zero subreddits found. Check raw HTML for ReCAPTCHA or expired cookie.");
			try {
				await db.insert(rawScraperResponses).values({
					htmlContent: html,
					urlScraped: targetUrl,
				});
			} catch (e) {}
			const msg = "DOM parse failed (Likely ReCAPTCHA or expired session).";
			await db.update(cronLogs).set({ status: "failed", errorMessage: msg, durationMs: Date.now() - startTime }).where(eq(cronLogs.id, log.id));
			return { message: msg, results: [] };
		}

		logger.info("Cron", `Successfully parsed ${parsedSubreddits.length} subreddits from explore/most_visited.`);

		const currentTime = sql`${getEasternTimeISO()}`;

		// Upsert logic...
		const subredditsToInsert = parsedSubreddits.map(sub => ({
			name: sub.name,
			isActive: true,
			consecutiveFailures: 0,
			lastSeenAt: currentTime,
			droppedAt: null,
			addedAt: currentTime,
		}));

		const upsertedSubreddits = await db
			.insert(subreddits)
			.values(subredditsToInsert)
			.onConflictDoUpdate({
				target: subreddits.name,
				set: { 
					isActive: true, 
					consecutiveFailures: 0, 
					lastSeenAt: currentTime, 
					droppedAt: null,
					addedAt: sql`CASE WHEN subreddits.is_active = false THEN ${currentTime} ELSE subreddits.added_at END`
				}
			})
			.returning({ id: subreddits.id, name: subreddits.name });

		const parsedNames = parsedSubreddits.map(sub => sub.name);
		await db.update(subreddits)
			.set({ isActive: false, droppedAt: currentTime })
			.where(and(eq(subreddits.isActive, true), notInArray(subreddits.name, parsedNames)));

		const nameToIdMap = new Map<string, number>();
		for (const row of upsertedSubreddits) {
			nameToIdMap.set(row.name, row.id);
		}

		const metricsToInsert = parsedSubreddits.map(sub => ({
			subredditId: nameToIdMap.get(sub.name)!,
			weeklyVisitors: sub.weeklyVisitors,
			recordedAt: currentTime,
		}));

		await db.insert(metricsHistory).values(metricsToInsert);

		await db
			.update(cronLogs)
			.set({ status: "success", errorMessage: null, durationMs: Date.now() - startTime })
			.where(eq(cronLogs.id, log.id));

		try {
			await calculateAndSaveMacroMetrics();
			logger.info("Cron", "Daily macro metrics snapshot calculated and saved.");
		} catch (macroErr: any) {
			logger.error("Cron", "Failed to calculate daily macro metrics", macroErr);
		}

		return { message: "Scraping cycle completed successfully.", results: parsedSubreddits.length };

	} catch (e: any) {
		logger.error("Cron", "Critical error in Puppeteer scrape handler", e);
		await db
			.update(cronLogs)
			.set({ status: "failed", errorMessage: e.message || "Unknown error", durationMs: Date.now() - startTime })
			.where(eq(cronLogs.id, log.id));
		throw e;
	}
}
