// The one place this app talks to the upstream public API. Used on the server
// only: pages and route handlers call it, visitors' browsers never do.

import source from "./source.json";

/**
 * How long a cached upstream response is reused, in seconds. Upstream
 * refreshes Polymarket P&L about every 5 minutes (spec DATA-07), so asking
 * more often would only cost its rate limit.
 */
export const UPSTREAM_REVALIDATE_SECONDS = 300;

/** A slow upstream must not hold a page render hostage. */
const UPSTREAM_TIMEOUT_MS = 8_000;

/** HTTP status upstream uses for an unknown trader or page. */
export const NOT_FOUND_STATUS = 404;

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
 * GETs a path on the upstream origin and returns the parsed JSON body,
 * unvalidated: callers pass it through their schema. Throws UpstreamError on a
 * network failure, a timeout, a non-2xx status or a body that is not JSON.
 */
export async function fetchUpstreamJson(path: string): Promise<unknown> {
  const url = new URL(path, source.origin);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: UPSTREAM_REVALIDATE_SECONDS },
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

/** True when upstream said the thing asked for does not exist. */
export function isNotFound(error: unknown): boolean {
  return error instanceof UpstreamError && error.status === NOT_FOUND_STATUS;
}
