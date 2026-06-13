export enum Category {
	ADVERTISING_PLATFORMS = "advertising_platforms",
	HIGH_VALUE_AD_VERTICALS = "high_value_ad_verticals",
	GEOGRAPHY = "geography",
}

export enum ArpuExpectation {
	HIGH = "high",
	MEDIUM = "medium",
	LOW = "low",
}

export interface TrackedGroup {
	category: Category;
	subCategory: string; // e.g., "Meta", "Gaming", or "United States"
	arpuExpectation?: ArpuExpectation;
	population?: number;
	subreddits: string[];
}

export const TARGET_SUBREDDITS: TrackedGroup[] = [
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Reddit",
		subreddits: ["redditforbusiness", "redditads"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Meta",
		subreddits: ["FacebookAds", "InstagramMarketing"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Google",
		subreddits: ["PPC", "googleads"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Amazon",
		subreddits: ["FulfillmentByAmazon", "AmazonSeller"],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Consumer Intent",
		subreddits: ["BuyItForLife", "shutupandtakemymoney"],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Gaming",
		subreddits: ["gaming", "Games", "pcgaming"],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Business/B2B",
		subreddits: ["Entrepreneur", "startups", "smallbusiness"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "United States",
		arpuExpectation: ArpuExpectation.HIGH,
		population: 345000000,
		subreddits: ["AskAnAmerican", "usa"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "United Kingdom",
		arpuExpectation: ArpuExpectation.HIGH,
		population: 68000000,
		subreddits: ["unitedkingdom", "AskUK", "CasualUK"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Canada",
		arpuExpectation: ArpuExpectation.HIGH,
		population: 40000000,
		subreddits: ["canada", "AskACanadian"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Germany",
		arpuExpectation: ArpuExpectation.HIGH,
		population: 84000000,
		subreddits: ["de", "AskAGerman"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "France",
		arpuExpectation: ArpuExpectation.HIGH,
		population: 66000000,
		subreddits: ["france", "AskFrance"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Spain",
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 47000000,
		subreddits: ["spain", "es"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Brazil",
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 218000000,
		subreddits: ["brasil"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Mexico",
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 131000000,
		subreddits: ["mexico"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "India",
		arpuExpectation: ArpuExpectation.LOW,
		population: 1450000000,
		subreddits: ["india", "cricket", "hindi", "indiasocial"],
	},
];
