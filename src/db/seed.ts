import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './index';
import { subreddits } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('Seeding subreddits from JSON...');
  
  const jsonPath = path.resolve(__dirname, '../data/subreddits.json');
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(fileContent);

  const targetSubreddits = [];

  for (const [category, regions] of Object.entries(data)) {
    for (const [region, subs] of Object.entries(regions as any)) {
      for (const sub of subs as string[]) {
        targetSubreddits.push({ name: sub, category });
      }
    }
  }

  for (const sub of targetSubreddits) {
    await db.insert(subreddits).values(sub).onConflictDoNothing();
  }
  
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
