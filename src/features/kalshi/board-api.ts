// The browser side of /api/kalshi/[period]: our own cached route.

import { fetchBoardPayload } from "@/lib/board-payload";

import type { KalshiPayload } from "./data";
import type { KalshiPeriod, KalshiTrader } from "./model";

/** One Kalshi period from our own cached route, in the browser, checked before use. */
export function fetchKalshiBoard(period: KalshiPeriod): Promise<KalshiPayload> {
  return fetchBoardPayload<KalshiPeriod, KalshiTrader>(
    `/api/kalshi/${period}`,
    period,
    (row) => typeof row.username === "string" && typeof row.rank === "number",
  );
}
