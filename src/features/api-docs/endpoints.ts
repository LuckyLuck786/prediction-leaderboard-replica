// The routes this demo serves. Each one is ours, cached on our server, and
// built only from the documented upstream API.

import { LEADERBOARD_PERIODS } from "@/features/leaderboard/model";
import { KALSHI_PERIODS } from "@/features/kalshi/model";
import { UPSTREAM_REVALIDATE_SECONDS } from "@/upstream/client";

export interface EndpointDoc {
  path: string;
  description: string;
  params: string;
  example: string;
  fields: string;
}

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

export const CACHE_MINUTES = UPSTREAM_REVALIDATE_SECONDS / 60;

export const FETCH_EXAMPLE = `// The 10 biggest Kalshi winners this week
const res = await fetch("/api/kalshi/7d");
const { board, source } = await res.json();
console.log(source.kind); // "live", or "snapshot" when upstream is down
board.traders.slice(0, 10).forEach((t) => console.log(t.rank, t.name, t.pnl));`;
