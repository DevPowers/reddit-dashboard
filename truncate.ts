import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function truncate() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`TRUNCATE TABLE subreddits CASCADE`;
  console.log('Truncated subreddits');
  await sql.end();
}

truncate();
