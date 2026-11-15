// Live Kalshi board with the saved snapshot as the fallback. Server only.

import { z } from "zod";

import { fetchUpstreamJson } from "@/upstream/client";
import type { DataSource } from "@/upstream/data-source";
import { SAVED_SNAPSHOT, parseSnapshotFile } from "@/upstream/snapshot";

import { KALSHI_BOARD_LIMIT, KALSHI_PERIODS, type KalshiBoard, type KalshiPeriod } from "./model";
import { parseKalshiBoard } from "./schema";

export interface KalshiPayload {
  board: KalshiBoard;
  source: DataSource;
}

const periodMetaSchema = z.object({ upstreamTotal: z.number().int().nonnegative() });

/** Parses the Kalshi boards out of a snapshot file; throws when it is broken (D-026). */
export function parseKalshiSnapshot(input: unknown): Record<KalshiPeriod, KalshiPayload> {
  const file = parseSnapshotFile(input);
  const boards = {} as Record<KalshiPeriod, KalshiPayload>;
  for (const period of KALSHI_PERIODS) {
    const saved = file.kalshi[period];
    const meta = periodMetaSchema.safeParse(saved);
    const parsed = parseKalshiBoard(saved, period);
    if (!meta.success || !parsed.ok) {
      const reason = parsed.ok ? "upstreamTotal is missing" : parsed.error;
      throw new Error(`Saved Kalshi snapshot for ${period} is invalid: ${reason}`);
    }
    boards[period] = {
      board: parsed.board,
      source: { kind: "snapshot", capturedAt: file.capturedAt, upstreamTotal: meta.data.upstreamTotal },
    };
  }
  return boards;
}

let saved: Record<KalshiPeriod, KalshiPayload> | undefined;

/** The committed Kalshi boards, parsed on first use and kept (D-026). */
export function loadKalshiSnapshot(): Record<KalshiPeriod, KalshiPayload> {
  saved ??= parseKalshiSnapshot(SAVED_SNAPSHOT);
  return saved;
}

/** One Kalshi period: live when upstream answers with valid data, else the labelled snapshot. Server only. */
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
