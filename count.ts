import { TARGET_SUBREDDITS, PREMIUM_PROXIED_SUBS } from "./src/data/subreddits";
let count = 0;
TARGET_SUBREDDITS.forEach(g => count += g.subreddits.length);
console.log("Total subs: " + count);
console.log("Premium subs: " + PREMIUM_PROXIED_SUBS.length);
