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
