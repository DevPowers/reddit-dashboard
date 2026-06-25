import { Category, type TrackedGroup } from "../types";

// Only use premium ScraperAPI proxies for heavily-fortified default subreddits
// to conserve API credits (costs 10-25 credits instead of 5).
export const PREMIUM_PROXIED_SUBS = [
    "AskReddit",
    "movies",
    "memes",
    "gaming",
    "funny",
    "worldnews",
    "todayilearned",
    "aww",
    "Music",
    "Showerthoughts",
    "ExplainLikeImFive",
    "NoStupidQuestions",
    "AskScience",
    "whatisthisthing"
];

export const TARGET_SUBREDDITS: TrackedGroup[] = [{
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
        subreddits: ["FulfillmentByAmazon"],
    },
    {
        category: Category.WORLD_GROWTH,
        subCategory: "Top 10 Defaults",
        subreddits: [
            "AskReddit",
            "funny",
            "worldnews",
            "gaming",
            "todayilearned",
            "aww",
            "Music",
            "movies",
            "memes",
            "Showerthoughts"
        ],
    },

    // ==========================================
    // --- 2. HIGH VALUE AD VERTICALS ---
    // ==========================================
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "High-Ticket & Big Box Retail",
        subreddits: ["BuyItForLife", "Watches", "Watchexchange", "Rolex", "handbags", "Mattress", "ikea", "Lego", "Costco", "Target"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Automotive",
        subreddits: ["cars", "Toyota", "Ford", "Honda", "electricvehicles", "whatcarshouldIbuy", "mercedes_benz", "bmw", "audi", "porsche", "lexus", "mazda"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Gaming",
        subreddits: ["gaming", "buildapc", "PS5", "xbox", "NintendoSwitch", "Steam"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Business/B2B",
        subreddits: ["smallbusiness", "startups", "SaaS"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Financial Services",
        subreddits: ["personalfinance", "CreditCards", "investing", "stocks", "Bogleheads", "dividends", "FirstTimeHomeBuyer", "RealEstate", "amex", "Chase"],
    },
    {
        category: Category.SPORTS,
        subCategory: "Sports Betting & Gambling",
        subreddits: ["sportsbook", "sportsbetting", "gambling"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Retail Trading & Speculation",
        subreddits: ["wallstreetbets", "options", "Daytrading", "CryptoCurrency"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Travel & Hospitality",
        subreddits: ["travel", "Flights", "awardtravel", "marriott", "hyatt"],
    },
    {
        category: Category.SPORTS,
        subCategory: "U.S. Sports",
        subreddits: ["nfl", "nba", "baseball"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Fitness & Active Lifestyles",
        subreddits: ["Fitness", "bodyweightfitness", "swimming", "cycling", "running", "golf", "bicycling"],
    },
    {
        category: Category.HIGH_VALUE_AD_VERTICALS,
        subCategory: "Audiophile & AV",
        subreddits: ["audiophile", "hometheater", "headphones"],
    },

    // ==========================================
    // --- 3. GEOGRAPHY: HIGH ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "United States",
        population: 349035494,
        subreddits: ["nyc", "LosAngeles", "Chicago", "Seattle", "Austin"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "United Kingdom",
        population: 69931528,
        subreddits: ["london", "manchester", "unitedkingdom", "CasualUK", "UKPersonalFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Japan",
        population: 124000000,
        subreddits: ["tokyo", "japan", "japanlife", "JapanFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Australia",
        population: 26600000,
        subreddits: ["sydney", "melbourne", "australia", "AusFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Canada",
        population: 40467728,
        subreddits: ["toronto", "vancouver", "canada", "PersonalFinanceCanada"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Germany",
        population: 83644258,
        subreddits: ["berlin", "munich", "de", "Finanzen"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "France",
        population: 66746401,
        subreddits: ["paris", "france", "VosFinances"],
    },

    // ==========================================
    // --- 4. GEOGRAPHY: MEDIUM ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "Spain",
        population: 47850793,
        subreddits: ["madrid", "spain"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Italy",
        population: 58900000,
        subreddits: ["rome", "italy", "ItaliaPersonalFinance"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Brazil",
        population: 213562666,
        subreddits: ["saopaulo", "riodejaneiro", "brasil", "investimentos"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Mexico",
        population: 132997658,
        subreddits: ["MexicoCity", "Monterrey", "mexico", "MexicoFinanciero"],
    },

    // ==========================================
    // --- 5. GEOGRAPHY: LOW ARPU ---
    // ==========================================
    {
        category: Category.GEOGRAPHY,
        subCategory: "India",
        population: 1476625576,
        subreddits: ["mumbai", "delhi", "india", "BollyBlindsNGossip", "IndiaInvestments", "personalfinanceindia"],
    },
    {
        category: Category.GEOGRAPHY,
        subCategory: "Philippines",
        population: 115559000,
        subreddits: ["Philippines", "ChikaPH", "phinvest"],
    },

    // ==========================================
    // --- 6. UTILITY & Q&A (AI CANNIBALIZATION TRACKING) ---
    // ==========================================
    {
        category: Category.AI_CANNIBALISM,
        subCategory: "General Knowledge",
        subreddits: ["ExplainLikeImFive", "NoStupidQuestions", "OutOfTheLoop", "AskScience", "AskHistorians"],
    },
    {
        category: Category.AI_CANNIBALISM,
        subCategory: "Tech & Life Support",
        subreddits: ["techsupport", "buildapc", "personalfinance", "legaladvice", "homeimprovement"],
    },
    {
        category: Category.AI_CANNIBALISM,
        subCategory: "ID & Crowdsourcing",
        subreddits: ["whatisthisthing", "tipofmytongue", "HelpMeFind"],
    },
    {
        category: Category.AI_CANNIBALISM,
        subCategory: "Niche Hobbies & Crafts",
        subreddits: ["3Dprinting", "woodworking", "gardening", "houseplants", "Aquariums", "sewing"],
    },
    // ==========================================
    // --- 7. PERSONAL TRACKING ---
    // ==========================================
    {
        category: Category.PERSONAL_TRACKING,
        subCategory: "Personal",
        subreddits: ["fire", "redditstock"],
    },

    // ==========================================
    // --- 8. SPORTS (SEASONAL/IGNORED) ---
    // ==========================================
    {
        category: Category.SPORTS,
        subCategory: "Global Football",
        subreddits: ["premierleague", "Bundesliga", "Ligue1", "LaLiga", "SerieA", "LigaMX", "futebol"],
    },
    {
        category: Category.SPORTS,
        subCategory: "Cricket & Aus",
        subreddits: ["AFL", "IndiaCricket", "Cricket"],
    }
];
