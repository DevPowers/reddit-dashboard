import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { eq, gte, notInArray } from "drizzle-orm";
import { TARGET_SUBREDDITS } from "../../../data/subreddits";
import { db } from "../../../db/index";
import {
	cronLogs,
	metricsHistory,
	subredditGroups,
	subreddits,
	trackingGroups,
} from "../../../db/schema";

export const scrapeHandler = async ({ request }: { request: Request }) => {
	const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
	const CRON_SECRET = process.env.CRON_SECRET;

	// Verify Vercel Cron Secret
	if (CRON_SECRET) {
		const authHeader = request.headers.get("authorization");
		if (authHeader !== `Bearer ${CRON_SECRET}`) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

	if (!SCRAPER_API_KEY) {
		return Response.json(
			{ error: "Missing SCRAPER_API_KEY environment variable." },
			{ status: 500 },
		);
	}
	const [log] = await db
		.insert(cronLogs)
		.values({ status: "running" })
		.returning();

	const startTime = Date.now();

	try {
		// --- 1. Auto-Sync Database with TARGET_SUBREDDITS ---
		const expectedSubNames = new Set<string>();
		const expectedGroupSubCategories = new Set<string>();

		for (const group of TARGET_SUBREDDITS) {
			expectedGroupSubCategories.add(group.subCategory);

			// Upsert Group
			const [insertedGroup] = await db
				.insert(trackingGroups)
				.values({
					category: group.category,
					subCategory: group.subCategory,
					monetizationWeight: group.monetizationWeight,
					arpuExpectation: group.arpuExpectation,
					population: group.population,
				})
				.onConflictDoUpdate({
					target: trackingGroups.subCategory,
					set: {
						category: group.category,
						monetizationWeight: group.monetizationWeight,
						arpuExpectation: group.arpuExpectation,
						population: group.population,
					},
				})
				.returning({ id: trackingGroups.id });

			const groupId = insertedGroup.id;

			for (const sub of group.subreddits) {
				expectedSubNames.add(sub);

				// Upsert Subreddit
				const [insertedSub] = await db
					.insert(subreddits)
					.values({
						name: sub,
					})
					.onConflictDoUpdate({
						target: subreddits.name,
						set: { name: sub }, // Dummy update to get the returning ID
					})
					.returning({ id: subreddits.id });

				// Upsert Membership
				await db
					.insert(subredditGroups)
					.values({
						subredditId: insertedSub.id,
						groupId: groupId,
					})
					.onConflictDoNothing(); // If it already exists, do nothing
			}
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
			// Delete removed subreddits (this cascades to metrics and memberships)
			await db
				.delete(subreddits)
				.where(notInArray(subreddits.name, Array.from(expectedSubNames)));
		}

		// --- 2. Fetch Sync'd Subs and Scrape ---
		const allSubs = await db.select().from(subreddits);
		
		// Find which subreddits have already been scraped within the interval
		const scrapeIntervalDays = parseInt(process.env.SCRAPE_INTERVAL_DAYS || "3", 10);
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
		let currentKey = SCRAPER_API_KEY;

		const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

		// Batching by 5
		for (let i = 0; i < subs.length; i += 5) {
			const batch = subs.slice(i, i + 5);

			const batchPromises = batch.map(async (sub) => {
				const targetUrl = `https://www.reddit.com/r/${sub.name}/`;
				let scraperUrl = `https://api.scraperapi.com/?api_key=${currentKey}&url=${encodeURIComponent(targetUrl)}&render=true`;

				let response = await fetch(scraperUrl);

				if (
					(response.status === 429 || response.status === 403) &&
					process.env.SCRAPER_API_KEY_2
				) {
					console.warn(
						`Key rate limit hit (${response.status}). Switching to backup key...`,
					);
					currentKey = process.env.SCRAPER_API_KEY_2;
					scraperUrl = `https://api.scraperapi.com/?api_key=${currentKey}&url=${encodeURIComponent(targetUrl)}&render=true`;
					response = await fetch(scraperUrl);
				}

				if (!response.ok) {
					return {
						name: sub.name,
						status: "failed",
						error: response.statusText,
					};
				}

				const html = await response.text();
				const $ = cheerio.load(html);

				const header = $("shreddit-subreddit-header");
				const weekly_visitors = parseInt(
					header.attr("weekly-active-users") || "0",
					10,
				);
				const weekly_contributions = parseInt(
					header.attr("weekly-contributions") || "0",
					10,
				);

				await db.insert(metricsHistory).values({
					subredditId: sub.id,
					weeklyVisitors: weekly_visitors,
					weeklyContributions: weekly_contributions,
				});

				return {
					name: sub.name,
					status: "success",
					weeklyVisitors: weekly_visitors,
					weeklyContributions: weekly_contributions,
				};
			});

			const batchResults = await Promise.allSettled(batchPromises);

			for (const res of batchResults) {
				if (res.status === "fulfilled") {
					results.push(res.value);
				} else {
					results.push({
						status: "failed",
						error: res.reason,
					});
				}
			}

			// Slight delay between batches
			if (i + 5 < subs.length) {
				await delay(500);
			}
		}
		const failedCount = results.filter(r => r.status === "failed").length;
		const finalStatus = failedCount > 0 ? "failed" : "success";
		const errorMessage = failedCount > 0 ? `${failedCount} subreddits failed to fetch.` : null;

		await db
			.update(cronLogs)
			.set({
				status: finalStatus,
				errorMessage: errorMessage,
				durationMs: Date.now() - startTime,
			})
			.where(eq(cronLogs.id, log.id));

		return Response.json({
			message: finalStatus === "success" ? "Scraping cycle completed." : "Scraping cycle completed with some errors.",
			results,
		});
	} catch (e: any) {
		await db
			.update(cronLogs)
			.set({
				status: "failed",
				errorMessage: e.message || "Unknown error",
				durationMs: Date.now() - startTime,
			})
			.where(eq(cronLogs.id, log.id));
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
