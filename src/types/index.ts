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
	monetizationWeight: number;
	arpuExpectation?: ArpuExpectation;
	population?: number;
	subreddits: string[];
}
