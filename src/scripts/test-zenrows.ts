import "dotenv/config";
import * as cheerio from "cheerio";

async function main() {
	console.log("Testing ZenRows API...");
	if (!process.env.ZENROWS_API_KEY) {
		console.error("Missing ZENROWS_API_KEY in .env");
		return;
	}

	const targetUrl = "https://www.reddit.com/r/bodyweightfitness/";
	const zenRowsUrl = `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&js_render=true&premium_proxy=true`;

	console.log(`Fetching ${targetUrl} via ZenRows API...`);

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), 60000);

	try {
		const response = await fetch(zenRowsUrl, {
			signal: controller.signal,
		});
		clearTimeout(id);

		console.log(`Response Status: ${response.status} ${response.statusText}`);
		
		if (!response.ok) {
			console.error("Failed to fetch.");
			const text = await response.text();
			console.error("Error body:", text);
			return;
		}

		const html = await response.text();
		console.log(`Fetched ${html.length} bytes of HTML.`);

		const $ = cheerio.load(html);
		const header = $("shreddit-subreddit-header");
		
		if (header.length === 0) {
			console.warn("Could not find <shreddit-subreddit-header> in the HTML.");
			const title = $("title").text();
			console.log(`Page title: ${title}`);
			return;
		}

		const visitorsStr = header.attr("weekly-active-users");
		const contributionsStr = header.attr("weekly-contributions");

		console.log("Extracted raw attributes:");
		console.log(`weekly-active-users: ${visitorsStr}`);
		console.log(`weekly-contributions: ${contributionsStr}`);

		if (!visitorsStr || !contributionsStr) {
			console.warn("Attributes missing! Reddit might have served a blocked page or a different React hydration state.");
		} else {
			console.log("Success! ZenRows extracted the data perfectly!");
		}

	} catch (e: any) {
		clearTimeout(id);
		console.error("Error fetching via ZenRows:", e.message);
	}
}

main().catch(console.error);
