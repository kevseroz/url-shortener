import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { requireEnv } from "./env.js";
import * as schema from "./schema.js";

// One pool for the whole server, reused by every request. The pooled
// DATABASE_URL (hostname ends in -pooler) is the one for app traffic.
const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });

export const db = drizzle(pool, { schema });
