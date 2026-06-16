import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { eq, gte, notInArray, asc, inArray, sql } from "drizzle-orm";
import { TARGET_SUBREDDITS } from "../../../data/subreddits";
import { db } from "../../../db/index.server";
import {
	cronLogs,
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	scraperKeys,
} from "../../../db/schema";
import { logger } from "../../../lib/logger";
import { calculateAndSaveMacroMetrics } from "../../../functions/macro";

export const runScrapeCycle = async () => {

	// Extract available keys from env
	const envKeys = [
		process.env.SCRAPER_API_KEY_1 || process.env.SCRAPER_API_KEY,
		process.env.SCRAPER_API_KEY_2,
		process.env.SCRAPER_API_KEY_3,
	].filter(Boolean) as string[];

	if (envKeys.length === 0) {
		logger.error("Cron", "Missing SCRAPER_API_KEY_X environment variables.");
		throw new Error("Missing SCRAPER_API_KEY_X environment variables.");
	}
	const [log] = await db
		.insert(cronLogs)
		.values({ status: "running" })
		.returning();

	const startTime = Date.now();
	logger.info("Cron", "Starting scrape cycle...");

	try {
		// --- 0. Key Rotation Logic ---
		let keysInDb = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
		
		// Seed missing keys if env has more than DB
		if (keysInDb.length < envKeys.length) {
			logger.info("Cron", `Seeding new API keys into database. Env has ${envKeys.length}, DB has ${keysInDb.length}.`);
			for (let i = keysInDb.length; i < envKeys.length; i++) {
				await db.insert(scraperKeys).values({
					keyIndex: i + 1,
					isActive: keysInDb.length === 0 && i === 0, // Default to first key if totally empty
				});
			}
			keysInDb = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
		}

		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const isLockedOut = (keyRow: typeof keysInDb[0]) => {
			return keyRow.lastErrorAt && new Date(keyRow.lastErrorAt) > twentyFourHoursAgo;
		};

		let activeKeyRow = keysInDb.find(k => k.isActive);

		if (!activeKeyRow || isLockedOut(activeKeyRow)) {
			const availableKeys = keysInDb.filter(k => !isLockedOut(k));
			if (availableKeys.length === 0) {
				throw new Error("All ScraperAPI keys have been exhausted/rate-limited within the last 24 hours.");
			}
			
			await db.update(scraperKeys).set({ isActive: false }).where(eq(scraperKeys.isActive, true));
			activeKeyRow = availableKeys[0];
			await db.update(scraperKeys).set({ isActive: true }).where(eq(scraperKeys.id, activeKeyRow.id));
			logger.info("Cron", `Rotated active key to index ${activeKeyRow.keyIndex}`);
		}

		let currentKeyString = envKeys[activeKeyRow.keyIndex - 1];
		let currentKeyRowId = activeKeyRow.id;

		// --- 1. Auto-Sync Database with TARGET_SUBREDDITS (Bulk Optimized) ---
		const groupsToInsert = [];
		const subsToInsert: { name: string }[] = [];
		const groupNameToSubsMap = new Map<string, string[]>();
		const expectedGroupSubCategories = new Set<string>();
		const expectedSubNames = new Set<string>();

		for (const group of TARGET_SUBREDDITS) {
			expectedGroupSubCategories.add(group.subCategory);
			groupsToInsert.push({
				category: group.category,
				subCategory: group.subCategory,
				monetizationWeight: group.monetizationWeight,
				arpuExpectation: group.arpuExpectation,
				arpuMultiplier: group.arpuMultiplier,
				population: group.population,
			});
			groupNameToSubsMap.set(group.subCategory, group.subreddits);
			for (const sub of group.subreddits) {
				expectedSubNames.add(sub);
				subsToInsert.push({ name: sub });
			}
		}

		// Deduplicate subreddits before bulk insert
		const uniqueSubs = Array.from(expectedSubNames).map(name => ({ name }));

		const insertedGroups = await db
			.insert(trackingGroups)
			.values(groupsToInsert)
			.onConflictDoUpdate({
				target: trackingGroups.subCategory,
				set: {
					category: sql`EXCLUDED.category`,
					monetizationWeight: sql`EXCLUDED.monetization_weight`,
					arpuExpectation: sql`EXCLUDED.arpu_expectation`,
					arpuMultiplier: sql`EXCLUDED.arpu_multiplier`,
					population: sql`EXCLUDED.population`,
				},
			})
			.returning({ id: trackingGroups.id, subCategory: trackingGroups.subCategory });

		const insertedSubs = await db
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
				for (const name of subNames) {
					const subId = subMap.get(name);
					if (subId) {
						membershipsToInsert.push({ subredditId: subId, groupId });
					}
				}
			}
		}

		if (membershipsToInsert.length > 0) {
			await db
				.insert(subredditGroups)
				.values(membershipsToInsert)
				.onConflictDoNothing();
		}

		if (expectedGroupSubCategories.size > 0) {
			// Delete removed groups
			await db
				.delete(trackingGroups)
				.where(
					notInArray(
						trackingGroups.subCategory,
						Array.from(expectedGroupSubCategories),
					),
				);
		}

		if (expectedSubNames.size > 0) {
			// Prune removed subreddits from active tracking groups
			const trackedSubs = await db
				.select({ id: subreddits.id })
				.from(subreddits)
				.where(inArray(subreddits.name, Array.from(expectedSubNames)));

			if (trackedSubs.length > 0) {
				await db
					.delete(subredditGroups)
					.where(
						notInArray(
							subredditGroups.subredditId,
							trackedSubs.map((s) => s.id),
						),
					);
			}
		}

		// --- 2. Fetch Sync'd Subs and Scrape ---
		const allSubs = await db
			.selectDistinct({ id: subreddits.id, name: subreddits.name })
			.from(subreddits)
			.innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId));
		
		// Find which subreddits have already been scraped within the interval
		const scrapeIntervalDays = parseInt(process.env.SCRAPE_INTERVAL_DAYS || "4", 10);
		// Subtract a 12 hour wiggle room from the interval to prevent drift issues
		// E.g., if interval is 3 days (72 hours), cutoff is 60 hours ago.
		const cutoffHours = (scrapeIntervalDays * 24) - 12;
		const cutoff = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));

		const recentScrapes = await db
			.select({ subredditId: metricsHistory.subredditId })
			.from(metricsHistory)
			.where(gte(metricsHistory.recordedAt, cutoff));

		const scrapedIds = new Set(recentScrapes.map((r) => r.subredditId));
		const subs = allSubs.filter((sub) => !scrapedIds.has(sub.id));

		const results: any[] = [];

		const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

		// Shuffle the subs array so that subreddits at the end of the list 
		// don't get starved if earlier subreddits consistently timeout and consume the timebox
		for (let i = subs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[subs[i], subs[j]] = [subs[j], subs[i]];
		}

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

		// Batching by 5
		for (let i = 0; i < subs.length; i += 5) {
			const batch = subs.slice(i, i + 5);

			for (const sub of batch) {
				const targetUrl = `https://www.reddit.com/r/${sub.name}/`;
				let scraperUrl = `https://api.scraperapi.com/?api_key=${currentKeyString}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true`;

				await db.update(scraperKeys).set({ lastAttemptAt: new Date() }).where(eq(scraperKeys.id, currentKeyRowId));
				let response = await fetchWithTimeout(scraperUrl, 60000);

				if (!response.ok) {
					logger.warn("Cron", `Fetch failed for ${sub.name} with key index ${activeKeyRow!.keyIndex}`, { status: response.status });
					
					// Only hard-lock the key for 24 hours if we hit a concurrency/quota limit (429 or 403)
					if (response.status === 429 || response.status === 403) {
						await db.update(scraperKeys)
							.set({ lastErrorAt: new Date(), lastStatus: "failed" })
							.where(eq(scraperKeys.id, currentKeyRowId));
					} else {
						// For 408 Timeouts or 500s, just log the failure but keep the key alive in the pool
						await db.update(scraperKeys)
							.set({ lastStatus: "failed" })
							.where(eq(scraperKeys.id, currentKeyRowId));
					}
						
					// Attempt Rotation
					const allKeys = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
					const fallbackKeyRow = allKeys.find(k => k.id !== currentKeyRowId && (!k.lastErrorAt || new Date(k.lastErrorAt) <= new Date(Date.now() - 24 * 60 * 60 * 1000)));
					
					if (fallbackKeyRow && fallbackKeyRow.keyIndex <= envKeys.length) {
						logger.info("Cron", `Rotating to fallback key index ${fallbackKeyRow.keyIndex}`);
						await db.update(scraperKeys).set({ isActive: false }).where(eq(scraperKeys.isActive, true));
						await db.update(scraperKeys).set({ isActive: true }).where(eq(scraperKeys.id, fallbackKeyRow.id));
						
						activeKeyRow = fallbackKeyRow;
						currentKeyRowId = fallbackKeyRow.id;
						currentKeyString = envKeys[fallbackKeyRow.keyIndex - 1];
						
						scraperUrl = `https://api.scraperapi.com/?api_key=${currentKeyString}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true`;
						await db.update(scraperKeys).set({ lastAttemptAt: new Date() }).where(eq(scraperKeys.id, currentKeyRowId));
						response = await fetchWithTimeout(scraperUrl, 60000);
					}
					
					if (!response.ok) {
						logger.error("Cron", `Fallback fetch failed for ${sub.name}`);
						results.push({
							name: sub.name,
							status: "failed",
							error: response.statusText,
						});
						continue;
					}
				}

				await db.update(scraperKeys).set({ lastStatus: "success" }).where(eq(scraperKeys.id, currentKeyRowId));
				const html = await response.text();
				const $ = cheerio.load(html);

				const header = $("shreddit-subreddit-header");
				const wauAttr = header.attr("weekly-active-users");
				const wcAttr = header.attr("weekly-contributions");
				const weekly_visitors = Number(wauAttr);
				const weekly_contributions = Number(wcAttr);

				// Placeholder Validation Guard: Reddit's new web components serve a generic 3000/100 placeholder 
				// if the scraper is blocked from executing the client-side GraphQL hydration.
				if (weekly_visitors === 3000 && weekly_contributions === 100) {
					throw new Error("Anti-Bot Detection: ScraperAPI returned Reddit's generic un-hydrated placeholder (3000/100).");
				}

				if (isNaN(weekly_visitors) || isNaN(weekly_contributions) || (weekly_visitors === 0 && weekly_contributions === 0)) {
					logger.warn("Cron", `Missing or zero metrics for ${sub.name}. DOM may have changed or page didn't fully render.`);
					results.push({
						name: sub.name,
						status: "failed",
						error: "DOM parse failed or zero metrics",
					});
					continue;
				}

				await db.insert(metricsHistory).values({
					subredditId: sub.id,
					weeklyVisitors: weekly_visitors,
					weeklyContributions: weekly_contributions,
				});

				results.push({
					name: sub.name,
					status: "success",
					weeklyVisitors: weekly_visitors,
					weeklyContributions: weekly_contributions,
				});
			}

			// Slight delay between batches
			if (i + 5 < subs.length) {
				await delay(500);
			}
		}
		const failedCount = results.filter(r => r.status === "failed").length;
		const finalStatus = failedCount > 0 ? "failed" : "success";
		const errorMessage = failedCount > 0 ? `${failedCount} subreddits failed to fetch.` : null;

		if (finalStatus === "failed") {
			logger.warn("Cron", "Scrape cycle completed with failures", { failedCount });
		} else {
			logger.info("Cron", `Scrape cycle completely finished. Processed ${results.filter(r => r.status === "success").length} subreddits.`);
		}

		await db
			.update(cronLogs)
			.set({
				status: finalStatus,
				errorMessage: errorMessage,
				durationMs: Date.now() - startTime,
			})
			.where(eq(cronLogs.id, log.id));

		const successCount = results.filter(r => r.status === "success").length;
		if (successCount > 0) {
			try {
				await calculateAndSaveMacroMetrics();
				logger.info("Cron", "Macro metrics calculated and saved.");
			} catch (macroErr: any) {
				logger.error("Cron", "Failed to calculate macro metrics", macroErr);
			}
		}

		return {
			message: finalStatus === "success" ? "Scraping cycle completed." : "Scraping cycle completed with some errors.",
			results,
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
