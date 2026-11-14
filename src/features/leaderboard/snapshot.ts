// The saved snapshot: what the site renders when live data is unavailable.
// It goes through the same parser as a live response.

import { z } from "zod";

import rawSnapshot from "@/upstream/snapshot/leaderboard.json";

import { LEADERBOARD_PERIODS, type Leaderboard, type LeaderboardPeriod } from "./model";
import { parseLeaderboard } from "./schema";

export interface LeaderboardSnapshot {
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
  /** Combined profit of all tracked traders on the snapshot day, in dollars. */
  dailyProfit: number;
  boards: Record<LeaderboardPeriod, Leaderboard>;
  /**
   * How many traders upstream listed for each period when the snapshot was
   * taken. The snapshot keeps only some of them, and the page says so.
   */
  upstreamTotals: Record<LeaderboardPeriod, number>;
}

const snapshotSchema = z.object({
  capturedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "not a date"),
  dailyProfit: z.object({ raw: z.number() }),
  periods: z.record(z.string(), z.unknown()),
});

const periodMetaSchema = z.object({ upstreamTotal: z.number().int().nonnegative() });

/**
 * Parses a snapshot file. The snapshot is our own committed file, so a broken
 * one is a build-stopping defect: this throws, and the schema test and the
 * build both fail loudly rather than ship a blank page.
 */
export function parseSnapshot(input: unknown): LeaderboardSnapshot {
  const file = snapshotSchema.safeParse(input);
  if (!file.success) {
    throw new Error(`Saved snapshot is invalid: ${z.prettifyError(file.error)}`);
  }

  const boards = {} as Record<LeaderboardPeriod, Leaderboard>;
  const upstreamTotals = {} as Record<LeaderboardPeriod, number>;

  for (const period of LEADERBOARD_PERIODS) {
    const rawPeriod = file.data.periods[period];
    const meta = periodMetaSchema.safeParse(rawPeriod);
    const board = parseLeaderboard(rawPeriod, period);
    if (!meta.success || !board.ok) {
      const reason = board.ok ? "upstreamTotal is missing" : board.error;
      throw new Error(`Saved snapshot for period ${period} is invalid: ${reason}`);
    }
    boards[period] = board.leaderboard;
    upstreamTotals[period] = meta.data.upstreamTotal;
  }

  return {
    capturedAt: new Date(file.data.capturedAt).toISOString(),
    dailyProfit: file.data.dailyProfit.raw,
    boards,
    upstreamTotals,
  };
}

export function loadSnapshot(): LeaderboardSnapshot {
  return parseSnapshot(rawSnapshot);
}
