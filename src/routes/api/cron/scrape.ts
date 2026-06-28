import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { eq, gte, notInArray, asc, inArray, sql, and, lt } from "drizzle-orm";
import { TARGET_SUBREDDITS, PREMIUM_PROXIED_SUBS } from "../../../data/subreddits";
import { db } from "../../../db/index.server";
import {
	cronLogs,
	cronSubredditLogs,
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
	scraperKeys,
} from "../../../db/schema";
import { logger } from "../../../lib/logger";
import { calculateAndSaveMacroMetrics } from "../../../functions/macro";
import { getEasternTimeISO } from "../../../lib/calculations";
import { platformHistoricalMetrics } from "../../../db/schema";

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
	// --- Self-Healing: Clean up orphaned jobs ---
	// If a previous Node process was abruptly killed (e.g. Vercel timeout, OOM, or manual kill),
	// it will be stuck in 'running' forever. Any running job older than 2 hours is dead.
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

	// --- Concurrency Lock ---
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
				const errMsg = "All ScraperAPI keys have been exhausted/rate-limited within the last 24 hours.";
				logger.error("Cron", errMsg);
				await db
					.update(cronLogs)
					.set({
						status: "failed",
						errorMessage: errMsg,
						durationMs: Date.now() - startTime,
					})
					.where(eq(cronLogs.id, log.id));
				return { message: "Scraping cycle aborted: " + errMsg, results: [] };
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
			.selectDistinct({ id: subreddits.id, name: subreddits.name, consecutiveFailures: subreddits.consecutiveFailures })
			.from(subreddits)
			.innerJoin(subredditGroups, eq(subreddits.id, subredditGroups.subredditId));
		
		// Find which subreddits have already been scraped within the interval
		const scrapeIntervalDays = parseInt(process.env.SCRAPE_INTERVAL_DAYS || "9", 10);
		// Subtract a 12 hour wiggle room from the interval to prevent drift issues
		// E.g., if interval is 3 days (72 hours), cutoff is 60 hours ago.
		const cutoffHours = (scrapeIntervalDays * 24) - 12;
		const cutoff = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));

		const successCutoff = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));
		const failureRetryCutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hour backoff

		const lastSuccessResult = await db
			.select({
				subredditId: cronSubredditLogs.subredditId,
				lastScraped: sql<string>`max(${cronSubredditLogs.ranAt})`,
			})
			.from(cronSubredditLogs)
			.where(eq(cronSubredditLogs.status, "success"))
			.groupBy(cronSubredditLogs.subredditId);

		const lastAttemptResult = await db
			.select({
				subredditId: cronSubredditLogs.subredditId,
				lastAttempt: sql<string>`max(${cronSubredditLogs.ranAt})`,
			})
			.from(cronSubredditLogs)
			.groupBy(cronSubredditLogs.subredditId);

		const lastSuccessMap = new Map<number, number>();
		for (const row of lastSuccessResult) {
			lastSuccessMap.set(row.subredditId, new Date(row.lastScraped).getTime());
		}

		const lastAttemptMap = new Map<number, number>();
		for (const row of lastAttemptResult) {
			lastAttemptMap.set(row.subredditId, new Date(row.lastAttempt).getTime());
		}

		// Filter out subreddits that have been scraped recently
		const subs = allSubs.filter((sub) => {
			const lastSuccessTime = lastSuccessMap.get(sub.id) || 0;
			const lastAttemptTime = lastAttemptMap.get(sub.id) || 0;
			
			// If it succeeded within the interval, don't scrape
			if (lastSuccessTime >= successCutoff.getTime()) return false;
			
			// If it failed, but we tried within the last 24 hours, don't scrape (backoff)
			if (lastAttemptTime >= failureRetryCutoff.getTime()) return false;
			
			return true;
		});

		// Sort subreddits so the ones that have gone the longest without a scrape are targeted first
		subs.sort((a, b) => {
			const timeA = lastAttemptMap.get(a.id) || 0;
			const timeB = lastAttemptMap.get(b.id) || 0;
			return timeA - timeB;
		});

		const results: any[] = [];
		const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
				const fetchStartMs = Date.now();
				const targetUrl = `https://www.reddit.com/r/${sub.name}/`;
				let scraperUrl = `https://api.scraperapi.com/?api_key=${currentKeyString}&url=${encodeURIComponent(targetUrl)}&render=true`;
				const usePremium = PREMIUM_PROXIED_SUBS.includes(sub.name) || sub.consecutiveFailures >= 1;
				const useZenRows = sub.consecutiveFailures >= 2 && process.env.ZENROWS_API_KEY;

				if (sub.consecutiveFailures >= 2 && !process.env.ZENROWS_API_KEY) {
					logger.warn("Cron", `[Attempt ${sub.consecutiveFailures + 1}] r/${sub.name} has 2+ consecutive failures, but ZENROWS_API_KEY is missing. Falling back to ScraperAPI Premium.`);
				}

				if (useZenRows) {
					scraperUrl = `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&js_render=true&premium_proxy=true`;
				} else if (usePremium) {
					scraperUrl += "&premium=true";
				}

				const attemptNum = sub.consecutiveFailures + 1;
				const providerNameStr = useZenRows ? "ZenRows" : (usePremium ? "ScraperAPI Premium" : "ScraperAPI Standard");
				logger.info("Cron", `[Attempt ${attemptNum}] Now trying to scrape r/${sub.name} using ${providerNameStr} (Key Index ${activeKeyRow!.keyIndex})...`);

				if (!useZenRows) {
					await db.update(scraperKeys).set({ lastAttemptAt: new Date() }).where(eq(scraperKeys.id, currentKeyRowId));
				}
				
				let response = await fetchWithTimeout(scraperUrl, 60000);

				if (!response.ok) {
					logger.warn("Cron", `[Attempt ${attemptNum}] Failed to scrape r/${sub.name} using ${providerNameStr}. Reason: Status Code ${response.status} (${response.statusText || 'Unknown Error'})`);
					
					if (!useZenRows) {
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
					}
						
					// Attempt Rotation ONLY if we hit a quota/rate limit error AND we aren't using ZenRows
					let fallbackUsed = false;
					if (!useZenRows && (response.status === 429 || response.status === 403)) {
						const allKeys = await db.select().from(scraperKeys).orderBy(asc(scraperKeys.keyIndex));
						const fallbackKeyRow = allKeys.find(k => k.id !== currentKeyRowId && (!k.lastErrorAt || new Date(k.lastErrorAt) <= new Date(Date.now() - 24 * 60 * 60 * 1000)));
						
						if (fallbackKeyRow && fallbackKeyRow.keyIndex <= envKeys.length) {
							logger.info("Cron", `Rotating to fallback key index ${fallbackKeyRow.keyIndex}`);
							await db.update(scraperKeys).set({ isActive: false }).where(eq(scraperKeys.isActive, true));
							await db.update(scraperKeys).set({ isActive: true }).where(eq(scraperKeys.id, fallbackKeyRow.id));
							
							activeKeyRow = fallbackKeyRow;
							currentKeyRowId = fallbackKeyRow.id;
							currentKeyString = envKeys[fallbackKeyRow.keyIndex - 1];
							
							scraperUrl = `https://api.scraperapi.com/?api_key=${currentKeyString}&url=${encodeURIComponent(targetUrl)}&render=true`;
							const fallbackUsePremium = PREMIUM_PROXIED_SUBS.includes(sub.name) || sub.consecutiveFailures >= 1;
							if (fallbackUsePremium) {
								scraperUrl += "&premium=true";
							}
							
							const fallbackProviderStr = fallbackUsePremium ? "ScraperAPI Premium" : "ScraperAPI Standard";
							logger.info("Cron", `Switching to API key ${fallbackKeyRow.keyIndex} for provider ${fallbackProviderStr}...`);
							logger.info("Cron", `[Attempt ${attemptNum} Fallback] Now trying to scrape r/${sub.name} using ${fallbackProviderStr} (Key Index ${fallbackKeyRow.keyIndex})...`);
							
							await db.update(scraperKeys).set({ lastAttemptAt: new Date() }).where(eq(scraperKeys.id, currentKeyRowId));
							response = await fetchWithTimeout(scraperUrl, 60000);
							fallbackUsed = true;
						}
					}
					
					if (!response.ok) {
						if (fallbackUsed) {
							logger.error("Cron", `[Attempt ${attemptNum} Fallback] Fetch completely failed for r/${sub.name}. Moving to next subreddit.`);
						}
						
						results.push({
							name: sub.name,
							status: "failed",
							error: response.statusText,
						});
						
						const providerStr = useZenRows ? "zenrows" : (usePremium ? "scraperapi_premium" : "scraperapi_standard");
						
						await db.insert(cronSubredditLogs).values({
							cronLogId: log.id,
							subredditId: sub.id,
							status: "failed",
							errorMessage: response.statusText || null,
							httpCode: response.status || null,
							usedPremium: usePremium || !!useZenRows,
							provider: providerStr,
							durationMs: Date.now() - fetchStartMs,
							ranAt: sql`${getEasternTimeISO()}`,
						});
						
						// Increment consecutiveFailures if it's not a quota/rate limit error (or if using ZenRows)
						if (useZenRows || (response.status !== 403 && response.status !== 429)) {
							await db.update(subreddits)
								.set({ consecutiveFailures: sub.consecutiveFailures + 1 })
								.where(eq(subreddits.id, sub.id));
						}
						continue;
					}
				}

				if (!useZenRows) {
					await db.update(scraperKeys).set({ lastStatus: "success" }).where(eq(scraperKeys.id, currentKeyRowId));
				}
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
					logger.warn("Cron", `Anti-Bot Detection for ${sub.name}. Generic un-hydrated placeholder.`);
					results.push({
						name: sub.name,
						status: "failed",
						error: "Anti-Bot Detection Placeholder",
					});
					await db.insert(cronSubredditLogs).values({
						cronLogId: log.id,
						subredditId: sub.id,
						status: "failed",
						errorMessage: "Anti-Bot Detection Placeholder",
						httpCode: response.status || null,
						usedPremium: usePremium || !!useZenRows,
						provider: useZenRows ? "zenrows" : (usePremium ? "scraperapi_premium" : "scraperapi_standard"),
						durationMs: Date.now() - fetchStartMs,
						ranAt: sql`${getEasternTimeISO()}`,
					});
					await db.update(subreddits)
						.set({ consecutiveFailures: sub.consecutiveFailures + 1 })
						.where(eq(subreddits.id, sub.id));
					continue;
				}

				if (isNaN(weekly_visitors) || isNaN(weekly_contributions) || (weekly_visitors === 0 && weekly_contributions === 0)) {
					logger.warn("Cron", `Missing or zero metrics for ${sub.name}. DOM may have changed or page didn't fully render.`);
					results.push({
						name: sub.name,
						status: "failed",
						error: "DOM parse failed or zero metrics",
					});
					await db.insert(cronSubredditLogs).values({
						cronLogId: log.id,
						subredditId: sub.id,
						status: "failed",
						errorMessage: "DOM parse failed or zero metrics",
						httpCode: response.status || null,
						usedPremium: usePremium || !!useZenRows,
						provider: useZenRows ? "zenrows" : (usePremium ? "scraperapi_premium" : "scraperapi_standard"),
						durationMs: Date.now() - fetchStartMs,
						ranAt: sql`${getEasternTimeISO()}`,
					});
					await db.update(subreddits)
						.set({ consecutiveFailures: sub.consecutiveFailures + 1 })
						.where(eq(subreddits.id, sub.id));
					continue;
				}

				await db.insert(metricsHistory).values({
					subredditId: sub.id,
					weeklyVisitors: weekly_visitors,
					weeklyContributions: weekly_contributions,
					recordedAt: sql`${getEasternTimeISO()}`,
				});

				const providerStr = useZenRows ? "zenrows" : (usePremium ? "scraperapi_premium" : "scraperapi_standard");

				await db.insert(cronSubredditLogs).values({
					cronLogId: log.id,
					subredditId: sub.id,
					status: "success",
					errorMessage: null,
					httpCode: response.status || null,
					usedPremium: usePremium || !!useZenRows,
					provider: providerStr,
					durationMs: Date.now() - fetchStartMs,
					ranAt: sql`${getEasternTimeISO()}`,
				});

				// Reset failures on success
				if (sub.consecutiveFailures > 0) {
					await db.update(subreddits).set({ consecutiveFailures: 0 }).where(eq(subreddits.id, sub.id));
				}
				logger.info("Cron", `[Attempt ${attemptNum}] Successfully scraped r/${sub.name} using ${providerStr}. Visitors: ${weekly_visitors}, Contributions: ${weekly_contributions}`);

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
		const failureThreshold = Math.max(Math.floor(subs.length * 0.2), 1);
		const finalStatus = failedCount > failureThreshold ? "failed" : "success";
		const errorMessage = failedCount > 0 ? `${failedCount} out of ${subs.length} subreddits failed to fetch (Status: ${finalStatus})` : null;

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

		// --- Macro Metrics Daily Snapshot ---
		// We want a daily snapshot of the macro metrics even if no new subreddits were scraped today.
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const [recentMacro] = await db
			.select({ id: platformHistoricalMetrics.id })
			.from(platformHistoricalMetrics)
			.where(gte(platformHistoricalMetrics.recordedAt, todayStart))
			.limit(1);

		if (!recentMacro) {
			try {
				await calculateAndSaveMacroMetrics();
				logger.info("Cron", "Daily macro metrics snapshot calculated and saved.");
			} catch (macroErr: any) {
				logger.error("Cron", "Failed to calculate daily macro metrics", macroErr);
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
