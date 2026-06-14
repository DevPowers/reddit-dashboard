import { ArpuExpectation, Category, type TrackedGroup } from "../types";

export const TARGET_SUBREDDITS: TrackedGroup[] = [
	// ==========================================
	// --- 1. ADVERTISING PLATFORMS ---
	// ==========================================
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Reddit",
		monetizationWeight: 2.5,
		subreddits: ["redditads"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Meta",
		monetizationWeight: 2.5,
		subreddits: ["FacebookAds"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Google",
		monetizationWeight: 2.5,
		subreddits: ["PPC", "adwords"],
	},
	{
		category: Category.ADVERTISING_PLATFORMS,
		subCategory: "Amazon",
		monetizationWeight: 2.5,
		subreddits: ["FulfillmentByAmazon", "AmazonSeller"],
	},

	// ==========================================
	// --- 2. HIGH VALUE AD VERTICALS ---
	// ==========================================
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "High-Ticket & Big Box Retail",
		monetizationWeight: 3.5,
		subreddits: [
			"BuyItForLife",
			"Watches",
			"Watchexchange",
			"Rolex",
			"handbags",
			"Mattresses",
			"Furniture",
			"Lego",
			"Costco",
			"Target",
		],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Automotive",
		monetizationWeight: 4,
		subreddits: [
			"cars",
			"Toyota",
			"Ford",
			"Honda",
			"electricvehicles",
			"whatcarshouldIbuy",
			"mercedes_benz",
			"bmw",
			"audi",
			"porsche",
			"lexus",
			"mazda",
		],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Gaming",
		monetizationWeight: 3,
		subreddits: [
			"gaming",
			"buildapc",
			"PS5",
			"xbox",
			"NintendoSwitch",
			"Steam",
		],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Business/B2B",
		monetizationWeight: 5,
		subreddits: ["smallbusiness", "startups", "SaaS"],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Financial Services",
		monetizationWeight: 4.5,
		subreddits: [
			"personalfinance",
			"CreditCards",
			"investing",
			"FirstTimeHomeBuyer",
			"RealEstate",
			"amex",
			"Chase",
		],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Sports Betting & Gambling",
		monetizationWeight: 4.5,
		subreddits: ["sportsbook", "sportsbetting", "dfsports"],
	},
	{
		category: Category.HIGH_VALUE_AD_VERTICALS,
		subCategory: "Retail Trading & Speculation",
		monetizationWeight: 4.5,
		subreddits: ["wallstreetbets", "options", "Daytrading"],
	},

	// ==========================================
	// --- 3. GEOGRAPHY: HIGH ARPU ---
	// ==========================================
	{
		category: Category.GEOGRAPHY,
		subCategory: "United States",
		monetizationWeight: 4,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 349035494,
		subreddits: [
			"nyc",
			"LosAngeles",
			"Chicago",
			"Seattle",
			"Austin",
			"nfl",
			"nba",
			"baseball",
		],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "United Kingdom",
		monetizationWeight: 3.5,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 69931528,
		subreddits: [
			"london",
			"manchester",
			"premierleague",
			"CasualUK",
			"UKPersonalFinance",
		],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Japan",
		monetizationWeight: 3,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 124000000,
		subreddits: ["tokyo", "japan", "japanese", "Anime", "JapanFinance"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Australia",
		monetizationWeight: 3.5,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 26600000,
		subreddits: ["sydney", "melbourne", "australia", "AFL", "AusFinance"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Canada",
		monetizationWeight: 3.5,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 40467728,
		subreddits: ["toronto", "vancouver", "hockey", "PersonalFinanceCanada"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Germany",
		monetizationWeight: 3,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 83644258,
		subreddits: ["berlin", "munich", "Bundesliga", "de", "Finanzen"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "France",
		monetizationWeight: 3,
		arpuExpectation: ArpuExpectation.HIGH,
		population: 66746401,
		subreddits: ["paris", "Ligue1", "france", "VosFinances"],
	},

	// ==========================================
	// --- 4. GEOGRAPHY: MEDIUM ARPU ---
	// ==========================================
	{
		category: Category.GEOGRAPHY,
		subCategory: "Spain",
		monetizationWeight: 2,
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 47519628,
		subreddits: ["madrid", "barcelona", "es", "LaLiga", "SpainEconomics"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Italy",
		monetizationWeight: 2,
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 58900000,
		subreddits: ["rome", "milan", "SerieA", "italy", "ItaliaPersonalFinance"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Brazil",
		monetizationWeight: 1.5,
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 213562666,
		subreddits: [
			"saopaulo",
			"riodejaneiro",
			"futebol",
			"brasil",
			"investimentos",
			"mercadolibre",
		],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Mexico",
		monetizationWeight: 1.5,
		arpuExpectation: ArpuExpectation.MEDIUM,
		population: 132997658,
		subreddits: [
			"MexicoCity",
			"Monterrey",
			"LigaMX",
			"mexico",
			"MexicoFinanciero",
			"mercadolibre",
		],
	},

	// ==========================================
	// --- 5. GEOGRAPHY: LOW ARPU ---
	// ==========================================
	{
		category: Category.GEOGRAPHY,
		subCategory: "India",
		monetizationWeight: 1,
		arpuExpectation: ArpuExpectation.LOW,
		population: 1428627663,
		subreddits: ["mumbai", "delhi", "Cricket", "india", "IndiaInvestments"],
	},
	{
		category: Category.GEOGRAPHY,
		subCategory: "Philippines",
		monetizationWeight: 1,
		arpuExpectation: ArpuExpectation.LOW,
		population: 115559009,
		subreddits: ["Manila", "Cebu", "Philippines", "phinvest", "BPOinPH"],
	},
];
