import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
	try {
		pool = new Pool({ connectionString: process.env.DATABASE_URL });
		db = drizzle(pool, { schema });
		console.log("✓ Database connected successfully");
	} catch (error) {
		console.warn(
			"⚠ Failed to connect to database:",
			error instanceof Error ? error.message : String(error),
		);
		db = null;
		pool = null;
	}
} else {
	console.log("ℹ DATABASE_URL not set - running in mock mode without database");
}

export { pool, db };
