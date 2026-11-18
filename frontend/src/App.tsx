import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { fetchLinks, shortenUrl, type ShortLink } from "./api";
import { AlertIcon, CheckIcon, CopyIcon } from "./icons";

type Link = ShortLink;

// "Your links" lives in this browser only. The database has every link from
// every visitor; without accounts, each browser remembers its own.
const STORAGE_KEY = "url-shortener:links";

function loadSavedLinks(): Link[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    // Private mode or blocked storage: start with an empty list.
    return [];
  }
}

function saveLinks(links: Link[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Storage full or blocked: the page still works, the list just won't persist.
  }
}

// Let people paste "github.com" without typing https:// first.
function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return relativeTime.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relativeTime.format(-hours, "hour");
  return relativeTime.format(-Math.round(hours / 24), "day");
}

export default function App() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Read the saved list before the first render, so it never flashes empty.
  const [links, setLinks] = useState<Link[]>(loadSavedLinks);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    saveLinks(links);
  }, [links]);

  // Refresh click counts when the page opens and whenever you come back to
  // the tab (for example after opening one of your short links).
  useEffect(() => {
    async function refresh() {
      const asked = new Set(loadSavedLinks().map((l) => l.code));
      if (asked.size === 0) return;
      try {
        const fresh = new Map((await fetchLinks([...asked])).map((l) => [l.code, l]));
        // Update what we asked about, drop links the server no longer knows,
        // and keep anything created while this request was in flight.
        setLinks((current) =>
          current.flatMap((l) => fresh.get(l.code) ?? (asked.has(l.code) ? [] : [l])),
        );
      } catch {
        // Server unreachable: keep showing the saved list as it was.
      }
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  function handleChange(value: string) {
    setInput(value);
    // Clear the error as soon as the user starts fixing it.
    if (error) setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();
    if (!value) {
      setError("Paste a link first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const link = await shortenUrl(withProtocol(value));
      setLinks((current) => [link, ...current]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(link: Link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedCode(link.code);
      setTimeout(() => {
        setCopiedCode((current) => (current === link.code ? null : current));
      }, 2000);
    } catch {
      setError("Couldn't copy. Select the link and copy it yourself.");
    }
  }

  return (
    <>
      <header className="band">
        <div className="band-inner">
          <h1>Make it short.</h1>
          <p className="lede">
            Paste a long link and get a short one in a second. Copy it and share it anywhere: a message, your CV, a
            slide.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="url">Long link</label>
            <div className="row">
              <input
                id="url"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore
                placeholder="https://example.com/a/very/long/link"
                value={input}
                onChange={(event) => handleChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby="url-error"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Shortening…" : "Shorten"}
              </button>
            </div>
            <p id="url-error" className="error" role="alert">
              {error && (
                <>
                  <AlertIcon />
                  {error}
                </>
              )}
            </p>
          </form>
        </div>
      </header>

      <main className="list">
        <h2 className="sr-only">Your links</h2>
        {links.length === 0 ? (
          <p className="empty">Your short links will appear here. Click Copy, then paste them wherever you like.</p>
        ) : (
          <ul>
            {links.map((link, i) => {
              const short = new URL(link.shortUrl);
              const copied = copiedCode === link.code;
              return (
                <li key={link.code} className="ticket" style={{ "--i": Math.min(i, 6) } as CSSProperties}>
                  <div className="ticket-text">
                    <a className="ticket-short" href={link.shortUrl} target="_blank" rel="noreferrer">
                      <span className="ticket-host">{short.host}</span>
                      <span className="ticket-code">{short.pathname}</span>
                    </a>
                    <span className="ticket-original" title={link.url}>
                      {link.url}
                    </span>
                  </div>
                  <span className="ticket-meta">
                    <span className="ticket-clicks">
                      {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                    </span>
                    <span className="ticket-time">{timeAgo(link.createdAt)}</span>
                  </span>
                  <button
                    type="button"
                    className="ticket-copy"
                    data-copied={copied ? "" : undefined}
                    onClick={() => handleCopy(link)}
                  >
                    <span className="ticket-icon" key={copied ? "check" : "copy"}>
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </span>
                    <span className="ticket-label">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
