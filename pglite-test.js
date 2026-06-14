import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './src/db/schema.js';

async function main() {
    console.log("Starting PGLite...");
    const client = new PGlite();
    console.log("PGLite started.");
    
    const db = drizzle(client, { schema });
    console.log("Drizzle connected.");

    console.log("Migrating...");
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log("Migrated successfully.");

    const res = await db.select().from(schema.subreddits);
    console.log("Subs:", res.length);
    
    await client.close();
}

main().catch(console.error);
