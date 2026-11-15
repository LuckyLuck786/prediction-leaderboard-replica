// Upstream settings that the API page shows as well as the server uses. Plain
// values, so a page or a test can read them without loading server code.

/**
 * How long a rendered page or route reuses its upstream data, in seconds.
 * Every route that reads upstream exports this as `revalidate` (a test keeps
 * them equal). Upstream refreshes Polymarket P&L about every 5 minutes (spec
 * DATA-07), so asking more often would only cost its rate limit.
 */
export const UPSTREAM_REVALIDATE_SECONDS = 300;

/** Polymarket's documented Data API (docs.polymarket.com, "Data API v2"). */
export const POLYMARKET_DATA_DEFAULT_ORIGIN = "https://data-api.polymarket.com";
