import { TARGET_SUBREDDITS } from "./src/data/subreddits";

const allSubs = TARGET_SUBREDDITS.flatMap(g => g.subreddits);
const duplicates = allSubs.filter((item, index) => allSubs.indexOf(item) !== index);
console.log("Duplicates:", duplicates);
