export enum Category {
	ADVERTISING_PLATFORMS = "advertising_platforms",
	HIGH_VALUE_AD_VERTICALS = "high_value_ad_verticals",
	GEOGRAPHY = "geography",
	WORLD_GROWTH = "world_growth",
	AI_CANNIBALISM = "ai_cannibalism",
	PERSONAL_TRACKING = "personal_tracking",
	SPORTS = "sports",
}

export interface TrackedGroup {
	category: Category;
	subCategory: string; // e.g., "Meta", "Gaming", or "United States"
	population?: number;
	subreddits: string[];
}

export interface MetricData {
	id: number;
	subredditId: number;
	name: string;
	category: string;
	subCategory: string;
	population: number | null;
	weeklyVisitors: number;
	weeklyContributions: number;
	recordedAt: Date | string;
	growthPercent?: number;
}
