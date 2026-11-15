// The one place this app talks to outside APIs: the upstream public API and
// Polymarket's documented Data API. Used on the server only: pages and route
// handlers call it, visitors' browsers never do.

import { POLYMARKET_DATA_ORIGIN, UPSTREAM_ORIGIN } from "./origins";

/**
 * How long a rendered page or route reuses its upstream data, in seconds.
 * Every route that reads upstream exports this as `revalidate` (a test keeps
 * them equal). Upstream refreshes Polymarket P&L about every 5 minutes (spec
 * DATA-07), so asking more often would only cost its rate limit.
 */
export const UPSTREAM_REVALIDATE_SECONDS = 300;

/** A slow upstream must not hold a page render hostage. */
const UPSTREAM_TIMEOUT_MS = 8_000;

/** HTTP status upstream uses for an unknown trader or page. */
const NOT_FOUND_STATUS = 404;

export class UpstreamError extends Error {
  constructor(
    message: string,
    /** HTTP status, or null when no response arrived at all. */
    readonly status: number | null,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/**
 * GETs a path on an origin and returns the parsed JSON body, unvalidated:
 * callers pass it through their schema. Throws UpstreamError on a network
 * failure, a timeout, a non-2xx status or a body that is not JSON.
 *
 * Never kept in Next.js's fetch cache (`cache: "no-store"`): the routes cache
 * their rendered output for UPSTREAM_REVALIDATE_SECONDS instead, and export
 * `dynamic = "force-static"` so this does not make them dynamic. When a cached
 * fetch goes stale, Next.js refreshes it without our abort signal, so during
 * an upstream outage that refresh hung and a production build failed after
 * 60 seconds (BUG-050). Leaving out the cache options is not enough: during a
 * build Next.js caches such fetches anyway, with the route's revalidate time.
 */
async function fetchJson(origin: string, path: string): Promise<unknown> {
  const url = new URL(path, origin);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new UpstreamError(`Could not reach ${url.pathname}: ${reason}`, null);
  }

  if (!response.ok) {
    throw new UpstreamError(`${url.pathname} answered ${response.status}`, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new UpstreamError(`${url.pathname} did not return JSON`, response.status);
  }
}

/** GETs a path on the upstream public API. */
export function fetchUpstreamJson(path: string): Promise<unknown> {
  return fetchJson(UPSTREAM_ORIGIN, path);
}

/** GETs a path on Polymarket's Data API. */
export function fetchPolymarketJson(path: string): Promise<unknown> {
  return fetchJson(POLYMARKET_DATA_ORIGIN, path);
}

/** True when upstream said the thing asked for does not exist. */
export function isNotFound(error: unknown): boolean {
  return error instanceof UpstreamError && error.status === NOT_FOUND_STATUS;
}
