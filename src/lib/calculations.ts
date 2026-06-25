/**
 * Shared pure calculation utilities used by both server-side macro aggregation
 * and client-side dashboard rendering. No DB or Node-only imports allowed.
 */

/**
 * Returns the current date as an ISO string formatted in Eastern Time with the explicit offset (e.g., -04:00)
 */
export function getEasternTimeISO(): string {
	const date = new Date();
	const sv = date.toLocaleString("sv-SE", { timeZone: "America/New_York" });
	const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" });
	const parts = formatter.formatToParts(date);
	const tzPart = parts.find(p => p.type === "timeZoneName")?.value;
	let offset = "-05:00"; // default to EST
	if (tzPart === "GMT-4") offset = "-04:00"; // EDT
	return sv.replace(" ", "T") + offset;
}

/**
 * Determines the most recent fiscal quarter-end date relative to `today`.
 * Q1 ends Mar 31, Q2 ends Jun 30, Q3 ends Sep 30, Q4 ends Dec 31.
 */
export function getQuarterEndBaseline(today: Date): Date {
	const year = today.getFullYear();
	const month = today.getMonth(); // 0-11

	if (month >= 3 && month < 6) return new Date(`${year}-03-31T00:00:00Z`);
	if (month >= 6 && month < 9) return new Date(`${year}-06-30T00:00:00Z`);
	if (month >= 9 && month < 12) return new Date(`${year}-09-30T00:00:00Z`);
	return new Date(`${year - 1}-12-31T00:00:00Z`);
}

/**
 * Calculates percentage-based velocity for a single subreddit.
 * Uses relative change instead of absolute delta so small high-value
 * subreddits aren't drowned out by large low-value ones.
 */
export function calculateSubVelocity(
	currentWAU: number,
	baselineWAU: number,
): number {
	if (baselineWAU <= 0) return 0;
	const pctChange = (currentWAU - baselineWAU) / baselineWAU;
	
	// Option B: Pure Unweighted Engagement Momentum
	// Velocity is now exactly equal to the percentage change of the subreddit.
	// When averaged together, this gives us the "Average Community Growth"
	// where every subreddit has an equal vote, regardless of its size or ARPU.
	return pctChange;
}

/**
 * Normalizes total velocity to a [-10, 10] bounded score.
 * Uses dynamic normalization based on the number of contributing subreddits
 * instead of a magic constant, so the score stays stable as subreddits are added/removed.
 */
export function normalizeVelocityScore(
	totalVelocity: number,
	contributingCount: number,
): number {
	if (contributingCount <= 0) return 0;
	// Since velocity is now pure percentage (e.g., 0.05 for 5%), 
	// multiplying by 100 converts it directly to a percentage-point score.
	// So 5% average growth = 5.0 score. 
	// Clamping at [-10, 10] means any average growth > 10% maxes out the index.
	const averagePct = totalVelocity / contributingCount;
	const scaled = averagePct * 100;
	return Math.max(-10, Math.min(10, scaled));
}

/**
 * Finds the data point whose recordedAt is closest to the target date.
 */
export function findClosestToDate<T extends { recordedAt: Date | string }>(
	history: T[],
	targetDate: Date,
): T | undefined {
	if (history.length === 0) return undefined;

	const targetTime = targetDate.getTime();
	let bestMatch = history[0];
	let smallestDiff = Math.abs(
		new Date(bestMatch.recordedAt).getTime() - targetTime,
	);

	for (const point of history) {
		const diff = Math.abs(
			new Date(point.recordedAt).getTime() - targetTime,
		);
		if (diff < smallestDiff) {
			smallestDiff = diff;
			bestMatch = point;
		}
	}

	return bestMatch;
}
