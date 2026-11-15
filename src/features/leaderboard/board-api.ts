// The browser side of /api/boards/[period]: our own cached route, never
// upstream directly (CLAUDE.md, data rules).

import { z } from "zod";

import type { BoardPayload } from "./data";
import type { LeaderboardPeriod, Trader } from "./model";

const boardApiPath = (period: LeaderboardPeriod) => `/api/boards/${period}`;

/**
 * Our own server builds this payload from validated data with the same types,
 * so the browser checks the outline and that it got the period it asked for.
 */
const payloadOutline = z.object({
  board: z.object({
    period: z.string(),
    lastUpdated: z.string(),
    traders: z.array(z.object({ id: z.string() }).loose()),
    rejectedCount: z.number(),
  }),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("live") }),
    z.object({ kind: z.literal("snapshot"), capturedAt: z.string(), upstreamTotal: z.number() }),
  ]),
});

/** One period of the board from our own cached route, in the browser, checked before use. */
export async function fetchBoard(period: LeaderboardPeriod): Promise<BoardPayload> {
  const response = await fetch(boardApiPath(period));
  if (!response.ok) throw new Error(`${boardApiPath(period)} answered ${response.status}`);
  const parsed = payloadOutline.safeParse(await response.json());
  if (!parsed.success) throw new Error(`${boardApiPath(period)}: ${z.prettifyError(parsed.error)}`);
  if (parsed.data.board.period !== period) {
    throw new Error(`${boardApiPath(period)} returned period ${parsed.data.board.period}`);
  }
  const { board, source } = parsed.data;
  return {
    board: { ...board, period, traders: board.traders as unknown as Trader[] },
    source,
  };
}
