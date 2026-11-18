import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { randomBytes } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db.js";
import { links } from "./schema.js";

const app = express();

// Hosting platforms like Render pick the port and pass it in PORT.
const PORT = Number(process.env.PORT) || 3000;

// On Render the app sits behind a proxy. This makes req.protocol report
// "https" (what the visitor used) instead of the proxy's internal "http".
app.set("trust proxy", 1);

// Which websites may call this API from the browser. Locally that's the Vite
// dev server; in production you set FRONTEND_URL to your Vercel address.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_URL }));

// Turns a JSON request body into a JS object on req.body.
app.use(express.json());

const CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type LinkRow = typeof links.$inferSelect;

// The shape the frontend receives for every link.
function toJson(req: Request, row: LinkRow) {
  return {
    code: row.code,
    url: row.url,
    clicks: row.clicks,
    createdAt: row.createdAt,
    shortUrl: `${req.protocol}://${req.get("host")}/${row.code}`,
  };
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Create a short link. Body: { "url": "https://..." }
app.post("/shorten", async (req, res) => {
  const url = req.body?.url;

  if (!isValidUrl(url)) {
    res.status(400).json({ error: "Send a valid http(s) URL in the 'url' field." });
    return;
  }

  // 4 random bytes → 6 URL-safe characters, e.g. "aZ3_x9". If that code is
  // already taken, the database skips the insert and we try a new one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomBytes(4).toString("base64url");
    const [row] = await db.insert(links).values({ code, url }).onConflictDoNothing().returning();
    if (row) {
      res.status(201).json(toJson(req, row));
      return;
    }
  }
  throw new Error("Could not find a free short code after 5 attempts.");
});

// Look up several links at once, e.g. GET /links?codes=aZ3_x9,Qw8-k1
// The frontend uses this to show fresh click counts for the links it saved.
app.get("/links", async (req, res) => {
  const raw = typeof req.query.codes === "string" ? req.query.codes : "";
  const codes = raw.split(",").filter((code) => CODE_PATTERN.test(code)).slice(0, 50);

  if (codes.length === 0) {
    res.json([]);
    return;
  }

  const rows = await db.select().from(links).where(inArray(links.code, codes));
  res.json(rows.map((row) => toJson(req, row)));
});

// Visit a short link. Must come after /health and /links, or those words
// would be read as codes.
app.get("/:code", async (req, res) => {
  // One query does both jobs: add a click and return where to go.
  // Doing it in SQL means two visits at the same moment can't lose a click.
  const [row] = await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
    .where(eq(links.code, req.params.code))
    .returning({ url: links.url });

  if (!row) {
    res.status(404).json({ error: "Short link not found." });
    return;
  }

  res.redirect(302, row.url);
});

// Express 5 sends errors thrown in async routes here. Log the details for
// us, and give the client a short message without internals.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
