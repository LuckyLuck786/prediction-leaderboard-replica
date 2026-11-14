// Live Kalshi board with the saved snapshot as the fallback. Server only.

import { z } from "zod";

import rawSnapshot from "@/upstream/snapshot/leaderboard.json";
import { fetchUpstreamJson } from "@/upstream/client";
import type { DataSource } from "@/features/leaderboard/data";

import { KALSHI_BOARD_LIMIT, KALSHI_PERIODS, type KalshiBoard, type KalshiPeriod } from "./model";
import { parseKalshiBoard } from "./schema";

export interface KalshiPayload {
  board: KalshiBoard;
  source: DataSource;
}

const snapshotSchema = z.object({
  capturedAt: z.string(),
  kalshi: z.record(z.string(), z.object({ upstreamTotal: z.number().int().nonnegative() }).loose()),
});

/** The saved Kalshi boards. A broken snapshot is a build-stopping defect (D-026). */
export function loadKalshiSnapshot(input: unknown = rawSnapshot) {
  const file = snapshotSchema.safeParse(input);
  if (!file.success) {
    throw new Error(`Saved Kalshi snapshot is invalid: ${z.prettifyError(file.error)}`);
  }
  const boards = {} as Record<KalshiPeriod, KalshiPayload>;
  for (const period of KALSHI_PERIODS) {
    const saved = file.data.kalshi[period];
    const parsed = parseKalshiBoard(saved, period);
    if (!saved || !parsed.ok) {
      throw new Error(`Saved Kalshi snapshot for ${period} is invalid: ${parsed.ok ? "missing" : parsed.error}`);
    }
    boards[period] = {
      board: parsed.board,
      source: {
        kind: "snapshot",
        capturedAt: new Date(file.data.capturedAt).toISOString(),
        upstreamTotal: saved.upstreamTotal,
      },
    };
  }
  return boards;
}

export async function getKalshiBoard(period: KalshiPeriod): Promise<KalshiPayload> {
  try {
    const body = await fetchUpstreamJson(
      `/api/kalshi-leaderboard?period=${period}&limit=${KALSHI_BOARD_LIMIT}`,
    );
    const parsed = parseKalshiBoard(body, period);
    if (!parsed.ok) throw new Error(`Kalshi board ${period} failed validation: ${parsed.error}`);
    if (parsed.board.rejectedCount > 0) {
      console.warn(
        `Kalshi board ${period}: dropped ${parsed.board.rejectedCount} traders that did not match the schema.`,
      );
    }
    return { board: parsed.board, source: { kind: "live" } };
  } catch (error) {
    console.error(`Kalshi board ${period}: live data unavailable, serving the snapshot.`, error);
    return loadKalshiSnapshot()[period];
  }
}
