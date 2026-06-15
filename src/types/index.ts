export enum Category {
	ADVERTISING_PLATFORMS = "advertising_platforms",
	HIGH_VALUE_AD_VERTICALS = "high_value_ad_verticals",
	GEOGRAPHY = "geography",
	PERSONAL_TRACKING = "personal_tracking",
}

export enum ArpuExpectation {
	HIGH = "high",
	MEDIUM = "medium",
	LOW = "low",
}

export interface TrackedGroup {
	category: Category;
	subCategory: string; // e.g., "Meta", "Gaming", or "United States"
	monetizationWeight: number;
	arpuMultiplier: number;
	arpuExpectation?: ArpuExpectation;
	population?: number;
	subreddits: string[];
}

export interface MetricData {
	id: number;
	subredditId: number;
	name: string;
	category: string;
	subCategory: string;
	monetizationWeight: number;
	arpuMultiplier: number;
	arpuExpectation: string | null;
	population: number | null;
	weeklyVisitors: number;
	weeklyContributions: number;
	recordedAt: Date | string;
	growthPercent?: number;
}
