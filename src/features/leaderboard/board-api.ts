// The browser side of /api/boards/[period]: our own cached route.

import { fetchBoardPayload } from "@/lib/board-payload";

import type { BoardPayload } from "./data";
import type { LeaderboardPeriod, Trader } from "./model";

/** One period of the board from our own cached route, in the browser, checked before use. */
export function fetchBoard(period: LeaderboardPeriod): Promise<BoardPayload> {
  return fetchBoardPayload<LeaderboardPeriod, Trader>(
    `/api/boards/${period}`,
    period,
    (row) => typeof row.id === "string",
  );
}
