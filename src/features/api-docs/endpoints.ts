// What the API page documents: the JSON routes this site serves (ours,
// cached on our server) and the documented upstream requests they are built
// from.

import { LEADERBOARD_PERIODS } from "@/features/leaderboard/model";
import { KALSHI_BOARD_LIMIT, KALSHI_PERIODS } from "@/features/kalshi/model";
import { POLYMARKET_DATA_DEFAULT_ORIGIN, UPSTREAM_REVALIDATE_SECONDS } from "@/upstream/settings";
import source from "@/upstream/source.json";

export interface EndpointDoc {
  path: string;
  description: string;
  params: string;
  example: string;
  fields: string;
}

/** The JSON routes this site serves, as the API page lists them. */
export const ENDPOINTS: readonly EndpointDoc[] = [
  {
    path: "/api/boards/{period}",
    description: "The cross-platform leaderboard for one period, validated and normalised.",
    params: `period=${LEADERBOARD_PERIODS.join("|")}`,
    example: "/api/boards/30d",
    fields:
      "board.period, board.lastUpdated, board.traders[] (id, name, platform, pnl, score, winRate, sharpe, roi, dayMover, ...), board.rejectedCount, source.kind",
  },
  {
    path: "/api/kalshi/{period}",
    description: "The top 1,000 Kalshi traders for one period.",
    params: `period=${KALSHI_PERIODS.join("|")}`,
    example: "/api/kalshi/7d",
    fields:
      "board.period, board.lastUpdated, board.traders[] (rank, username, name, pnl, profileId, kalshiUrl, xHandle, sportsShare), source.kind",
  },
];

/**
 * What this site reads to build its pages, all requested by our server, never
 * by the visitor's browser: six requests to the data source's documented
 * public API, one to Polymarket's documented Data API (D-035). A test checks
 * this list against the requests the code really makes, both ways.
 */
export const DATA_SOURCES: ReadonlyArray<{ origin: string; path: string; usedFor: string }> = [
  {
    origin: source.origin,
    path: `/api/leaderboard?period={${LEADERBOARD_PERIODS.join("|")}}`,
    usedFor: "the home and Polymarket boards",
  },
  { origin: source.origin, path: "/api/daily-profit", usedFor: "today's total above the boards" },
  {
    origin: source.origin,
    path: `/api/kalshi-leaderboard?period={${KALSHI_PERIODS.join("|")}}&limit=${KALSHI_BOARD_LIMIT}`,
    usedFor: "the Kalshi board",
  },
  { origin: source.origin, path: "/api/trader/{id}", usedFor: "profiles and the head-to-head page" },
  {
    origin: source.origin,
    path: "/api/kalshi/{username}/history",
    usedFor: "Kalshi P&L history and the head-to-head chart",
  },
  { origin: source.origin, path: "/api/kalshi/{username}/categories", usedFor: "Kalshi P&L by category" },
  {
    origin: POLYMARKET_DATA_DEFAULT_ORIGIN,
    path: "/v2/user-pnl?user={wallet}&interval=all&fidelity=1d",
    usedFor: "Polymarket P&L history and the head-to-head chart",
  },
];

const SECONDS_PER_MINUTE = 60;

/** How long a route's answer is reused, in minutes, for the API page's wording. */
export const CACHE_MINUTES = UPSTREAM_REVALIDATE_SECONDS / SECONDS_PER_MINUTE;

/** The example on the API page. */
export const FETCH_EXAMPLE = `// The 10 biggest Kalshi winners this week
const res = await fetch("/api/kalshi/7d");
const { board, source } = await res.json();
console.log(source.kind); // "live", or "snapshot" when upstream is down
board.traders.slice(0, 10).forEach((t) => console.log(t.rank, t.name, t.pnl));`;
