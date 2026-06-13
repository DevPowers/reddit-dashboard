import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Enabling RLS on tables...");
  await sql`ALTER TABLE subreddits ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE subreddit_metrics ENABLE ROW LEVEL SECURITY;`;
  console.log("RLS enabled successfully.");
  process.exit(0);
}

main().catch(console.error);
