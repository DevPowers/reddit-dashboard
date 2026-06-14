import { ArpuExpectation, Category, type TrackedGroup } from "../types";

export const TARGET_SUBREDDITS: TrackedGroup[] = [{
        category: Category.ADVERTISING_PLATFORMS,
        subCategory: "Reddit",
        monetizationWeight: 2.5,
        subreddits: ["redditforbusiness"],
    },
    {
        category: Category.ADVERTISING_PLATFORMS,
        subCategory: "Meta",
        monetizationWeight: 2.5,
        subreddits: ["FacebookAds", "InstagramMarketing"],
    },
    {
        category: Category.ADVERTISING_PLATFORMS,
        subCategory: "Google",
        monetizationWeight: 2.5,
        subreddits: ["PPC", "googleads"],
    },
    {
        category: Category.ADVERTISING_PLATFORMS,
        subCategory: "Amazon",
        monetizationWeight: 2.5,
        subreddits: ["FulfillmentByAmazon"],
    },

    // ==========================================
    // --- 2. HIGH VALUE AD VERTICALS ---
    // ==========================================
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "High-Ticket & Big Box Retail",
        monetizationWeight: 3.5,
        subreddits: ["BuyItForLife", "Watches", "Watchexchange", "Rolex", "handbags", "Mattress", "ikea", "Lego", "Costco", "Target"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Automotive",
        monetizationWeight: 4.0,
        subreddits: ["cars", "Toyota", "Ford", "Honda", "electricvehicles", "whatcarshouldIbuy", "mercedes_benz", "bmw", "audi", "porsche", "lexus", "mazda"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Gaming",
        monetizationWeight: 3.0,
        subreddits: ["gaming", "buildapc", "PS5", "xbox", "NintendoSwitch", "Steam"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Business/B2B",
        monetizationWeight: 5.0,
        subreddits: ["smallbusiness", "startups", "SaaS"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Financial Services",
        monetizationWeight: 4.5,
        subreddits: ["personalfinance", "CreditCards", "investing", "FirstTimeHomeBuyer", "RealEstate", "amex", "Chase"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Sports Betting & Gambling",
        monetizationWeight: 4.5,
        subreddits: ["sportsbook", "sportsbetting", "gambling"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Retail Trading & Speculation",
        monetizationWeight: 4.5,
        subreddits: ["wallstreetbets", "options", "Daytrading"],
    },
	 {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Travel & Hospitality",
        monetizationWeight: 4.0, 
        subreddits: ["travel", "Flights", "awardtravel", "marriott", "hyatt"],
    },

    // ==========================================
    // --- 3. GEOGRAPHY: HIGH ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "United States",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 4.0,
        population: 349035494,
        subreddits: ["nyc", "LosAngeles", "Chicago", "Seattle", "Austin", "nfl", "nba", "baseball"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "United Kingdom",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.5,
        population: 69931528,
        subreddits: ["london", "manchester", "premierleague", "CasualUK", "UKPersonalFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Japan",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.0,
        population: 124000000,
        subreddits: ["tokyo", "japan", "japanese", "Anime", "JapanFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Australia",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.5,
        population: 26600000,
        subreddits: ["sydney", "melbourne", "australia", "AFL", "AusFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Canada",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.5,
        population: 40467728,
        subreddits: ["toronto", "vancouver", "hockey", "PersonalFinanceCanada"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Germany",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.0,
        population: 83644258,
        subreddits: ["berlin", "munich", "Bundesliga", "de", "Finanzen"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "France",
        arpuExpectation: ArpuExpectation.HIGH,
        monetizationWeight: 3.0,
        population: 66746401,
        subreddits: ["paris", "Ligue1", "france", "VosFinances"],
    },

    // ==========================================
    // --- 4. GEOGRAPHY: MEDIUM ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "Spain",
        arpuExpectation: ArpuExpectation.MEDIUM,
        monetizationWeight: 2.0,
        population: 47850793,
        subreddits: ["madrid", "Barcelona", "LaLiga"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Italy",
        arpuExpectation: ArpuExpectation.MEDIUM,
        monetizationWeight: 2.0,
        population: 58900000,
        subreddits: ["rome", "SerieA", "italy", "ItaliaPersonalFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Brazil",
        arpuExpectation: ArpuExpectation.MEDIUM,
        monetizationWeight: 1.5,
        population: 213562666,
        subreddits: ["saopaulo", "riodejaneiro", "futebol", "brasil", "investimentos"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Mexico",
        arpuExpectation: ArpuExpectation.MEDIUM,
        monetizationWeight: 1.5,
        population: 132997658,
        subreddits: ["MexicoCity", "Monterrey", "LigaMX", "mexico", "MexicoFinanciero"],
    },

    // ==========================================
    // --- 5. GEOGRAPHY: LOW ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "India",
        arpuExpectation: ArpuExpectation.LOW,
        monetizationWeight: 1.0,
        population: 1476625576,
        subreddits: ["mumbai", "delhi", "hindi", "IndiaCricket", "BollyBlindsNGossip", "IndiaInvestments", "personalfinanceindia"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Philippines",
        arpuExpectation: ArpuExpectation.LOW,
        monetizationWeight: 1.0,
        population: 115559000,
        subreddits: ["Philippines", "ChikaPH", "phinvest"],
    },
];