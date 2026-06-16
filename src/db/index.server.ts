import * as dotenv from "dotenv";

dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (process.env.NODE_ENV === "test") {
    throw new Error("FATAL: Attempted to connect to the real Postgres database during a Vitest run. Mocks are misconfigured or leaky imports occurred.");
}
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is required.");
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
