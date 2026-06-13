import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { db } from "../../../db/index";
import { subredditMetrics, subreddits } from "../../../db/schema";

export const scrapeHandler = async () => {
	const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

	if (!SCRAPER_API_KEY) {
		return Response.json(
			{ error: "Missing SCRAPER_API_KEY environment variable." },
			{ status: 500 },
		);
	}

				try {
					const subs = await db.select().from(subreddits);
					const results = [];

					for (const sub of subs) {
						const targetUrl = `https://www.reddit.com/r/${sub.name}/`;
						const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

						const response = await fetch(scraperUrl);

						if (!response.ok) {
							results.push({
								name: sub.name,
								status: "failed",
								error: response.statusText,
							});
							continue;
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

						await db.insert(subredditMetrics).values({
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

					return Response.json({
						message: "Scraping cycle completed.",
						results,
					});
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
