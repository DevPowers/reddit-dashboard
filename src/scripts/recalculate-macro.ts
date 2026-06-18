import { calculateAndSaveMacroMetrics } from "../functions/macro";

async function main() {
    const res = await calculateAndSaveMacroMetrics();
    console.log("Recalculated:", res);
    process.exit(0);
}
main();
