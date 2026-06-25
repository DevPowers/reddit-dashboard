import fs from "fs";

const filepath = "src/data/subreddits.ts";
let content = fs.readFileSync(filepath, "utf8");

// 1. Change category for U.S. Sports and Sports Betting
content = content.replace(
  /category: Category\.HIGH_VALUE_AD_VERTICALS,\s*subCategory: "Sports Betting & Gambling",/g,
  `category: Category.SPORTS,\n        subCategory: "Sports Betting & Gambling",`
);

content = content.replace(
  /category: Category\.HIGH_VALUE_AD_VERTICALS,\s*subCategory: "U\.S\. Sports",/g,
  `category: Category.SPORTS,\n        subCategory: "U.S. Sports",`
);

// 2. Remove sports from geography arrays
content = content.replace(/"london", "manchester", "premierleague", "CasualUK", "UKPersonalFinance"/g, `"london", "manchester", "CasualUK", "UKPersonalFinance"`);
content = content.replace(/"sydney", "melbourne", "australia", "AFL", "AusFinance"/g, `"sydney", "melbourne", "australia", "AusFinance"`);
content = content.replace(/"berlin", "munich", "Bundesliga", "de", "Finanzen"/g, `"berlin", "munich", "de", "Finanzen"`);
content = content.replace(/"paris", "Ligue1", "france", "VosFinances"/g, `"paris", "france", "VosFinances"`);
content = content.replace(/"madrid", "spain", "LaLiga"/g, `"madrid", "spain"`);
content = content.replace(/"rome", "SerieA", "italy", "ItaliaPersonalFinance"/g, `"rome", "italy", "ItaliaPersonalFinance"`);
content = content.replace(/"MexicoCity", "Monterrey", "LigaMX", "mexico", "MexicoFinanciero"/g, `"MexicoCity", "Monterrey", "mexico", "MexicoFinanciero"`);
content = content.replace(/"mumbai", "delhi", "india", "IndiaCricket", "Cricket", "BollyBlindsNGossip", "IndiaInvestments", "personalfinanceindia"/g, `"mumbai", "delhi", "india", "BollyBlindsNGossip", "IndiaInvestments", "personalfinanceindia"`);

// 3. Append the new sports groups at the end of the array
const newGroups = `
    // ==========================================
    // --- 8. SPORTS (SEASONAL/IGNORED) ---
    // ==========================================
    {
        category: Category.SPORTS,
        subCategory: "Global Football",
        subreddits: ["premierleague", "Bundesliga", "Ligue1", "LaLiga", "SerieA", "LigaMX"],
    },
    {
        category: Category.SPORTS,
        subCategory: "Cricket & Aus",
        subreddits: ["AFL", "IndiaCricket", "Cricket"],
    }
];
`;

content = content.replace(/];[\s\n]*$/g, newGroups);

fs.writeFileSync(filepath, content);
console.log("Successfully transformed subreddits.ts");
