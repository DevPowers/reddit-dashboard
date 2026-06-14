import { TARGET_SUBREDDITS } from "../data/subreddits";
import { Category } from "../types";

export interface MetricRow {
	id: number;
	subredditId: number;
	name: string;
	category: string;
	subCategory: string;
	arpuExpectation: string;
	population: number;
	weeklyVisitors: number;
	weeklyContributions: number;
	recordedAt: Date;
}

export function generateMockMetrics(): MetricRow[] {
	const mockData: MetricRow[] = [];
	let idCounter = 1;
	let subIdCounter = 1;
	const subIdMap = new Map<string, number>();

	// Base Anchor Date: March 31, 2026
	const anchorDate = new Date("2026-03-31T00:00:00Z");
	const now = new Date();

	// Calculate total days between anchor and now
	const totalDays = Math.ceil(
		(now.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	const daysToGenerate = Math.max(1, totalDays);

	TARGET_SUBREDDITS.forEach((group, _groupIdx) => {
		group.subreddits.forEach((subName, _subIdx) => {
			// Base metrics logic
			let baseVisitors = 50000;
			if (group.population) {
				// Larger population = higher base visitors
				baseVisitors = Math.floor(group.population / 1000);
			} else if (group.category === Category.ADVERTISING_PLATFORMS) {
				baseVisitors = 25000;
			}

			for (let i = 0; i <= daysToGenerate; i++) {
				const recordedAt = new Date(anchorDate);
				recordedAt.setDate(anchorDate.getDate() + i);

				// Ensure we don't generate data into the future
				if (recordedAt > now) break;

				// Add some noise and trend (e.g. growing over time)
				// Ensure that at i=0, there's no trend factor
				const trendFactor = 1 + i * 0.005; // 0.5% growth per day from t0
				// Less noise at t0 to establish a clean baseline, more noise later
				const noise = i === 0 ? 1 : 0.9 + Math.random() * 0.2; // +/- 10%

				const visitors = Math.floor(baseVisitors * trendFactor * noise);
				const contributions = Math.floor(visitors * 0.05); // ~5% contribute

				let currentSubId = subIdMap.get(subName);
				if (!currentSubId) {
					currentSubId = subIdCounter++;
					subIdMap.set(subName, currentSubId);
				}

				mockData.push({
					id: idCounter++,
					subredditId: currentSubId,
					name: subName,
					category: group.category,
					subCategory: group.subCategory,
					arpuExpectation: group.arpuExpectation || "unknown",
					population: group.population || 0,
					weeklyVisitors: visitors,
					weeklyContributions: contributions,
					recordedAt,
				});
			}
		});
	});

	return mockData;
}
