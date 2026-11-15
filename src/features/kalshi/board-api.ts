// The browser side of /api/kalshi/[period]: our own cached route.

import { z } from "zod";

import type { KalshiPayload } from "./data";
import type { KalshiPeriod, KalshiTrader } from "./model";

const kalshiApiPath = (period: KalshiPeriod) => `/api/kalshi/${period}`;

/** Our own server builds this from validated data; the browser checks the outline. */
const payloadOutline = z.object({
  board: z.object({
    period: z.string(),
    lastUpdated: z.string(),
    traders: z.array(z.object({ username: z.string(), rank: z.number() }).loose()),
    rejectedCount: z.number(),
  }),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("live") }),
    z.object({ kind: z.literal("snapshot"), capturedAt: z.string(), upstreamTotal: z.number() }),
  ]),
});

/** One Kalshi period from our own cached route, in the browser, checked before use. */
export async function fetchKalshiBoard(period: KalshiPeriod): Promise<KalshiPayload> {
  const path = kalshiApiPath(period);
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  const parsed = payloadOutline.safeParse(await response.json());
  if (!parsed.success) throw new Error(`${path}: ${z.prettifyError(parsed.error)}`);
  if (parsed.data.board.period !== period) {
    throw new Error(`${path} returned period ${parsed.data.board.period}`);
  }
  const { board, source } = parsed.data;
  return {
    board: { ...board, period, traders: board.traders as unknown as KalshiTrader[] },
    source,
  };
}
