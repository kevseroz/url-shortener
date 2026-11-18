// Vite reads VITE_* variables from .env files at build time.
// Locally: .env.development. In production: set it in Vercel's settings.
const API_URL = import.meta.env.VITE_API_URL;

export type ShortLink = {
  code: string;
  url: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
};

export async function shortenUrl(url: string): Promise<ShortLink> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    // fetch only throws when no response arrives at all: server down, no
    // internet, or the browser blocked it (e.g. a CORS problem).
    throw new Error("Can't reach the server. Is the backend running?");
  }

  if (response.status === 400) {
    throw new Error("That doesn't look like a valid link.");
  }
  if (!response.ok) {
    throw new Error("Something went wrong. Try again.");
  }

  return response.json();
}

// Fresh data (mainly click counts) for links this browser saved.
export async function fetchLinks(codes: string[]): Promise<ShortLink[]> {
  const response = await fetch(`${API_URL}/links?codes=${codes.map(encodeURIComponent).join(",")}`);
  if (!response.ok) throw new Error(`GET /links failed with ${response.status}`);
  return response.json();
}
