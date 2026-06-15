import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";

export const Route = createFileRoute("/api/reddit/$subreddit")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const { subreddit } = params;

				try {
					const ADMIN_SECRET = process.env.ADMIN_SECRET;
					if (process.env.NODE_ENV === "production" && !ADMIN_SECRET) {
						return Response.json({ error: "Server Configuration Error" }, { status: 500 });
					}
					if (ADMIN_SECRET) {
						const authHeader = request.headers.get("authorization");
						if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
							return Response.json({ error: "Unauthorized" }, { status: 401 });
						}
					}

					const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

					if (!SCRAPER_API_KEY) {
						return Response.json(
							{ error: "Missing SCRAPER_API_KEY environment variable." },
							{ status: 500 },
						);
					}

					const targetUrl = `https://www.reddit.com/r/${subreddit}/`;
					// ScraperAPI requires the URL to be passed as a query parameter
					const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

					const response = await fetch(scraperUrl);

					if (!response.ok) {
						return Response.json(
							{
								error: `ScraperAPI failed to fetch page: ${response.statusText}`,
							},
							{ status: response.status },
						);
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

					const title = $("title").text();

					return Response.json({
						subreddit,
						title,
						htmlLength: html.length,
						weekly_visitors,
						weekly_contributions,
						message: "Successfully fetched and extracted metrics.",
					});
				} catch (e: any) {
					return Response.json({ error: e.message }, { status: 500 });
				}
			},
		},
	},
});
