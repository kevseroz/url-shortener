import { defineConfig } from "drizzle-kit";
import { requireEnv } from "./src/env.js";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations need the direct connection; the pooled one breaks them.
  dbCredentials: { url: requireEnv("DATABASE_URL_UNPOOLED") },
});
