import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per short link. Drizzle turns this into a CREATE TABLE migration.
export const links = pgTable("links", {
  code: text("code").primaryKey(),
  url: text("url").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
