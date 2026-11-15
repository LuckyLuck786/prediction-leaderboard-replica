// The saved snapshot: what the site renders when live data is unavailable.
// It goes through the same parser as a live response.

import "server-only";

import { z } from "zod";

import { SAVED_SNAPSHOT, parseSnapshotFile } from "@/upstream/snapshot";

import { LEADERBOARD_PERIODS, type Leaderboard, type LeaderboardPeriod } from "./model";
import { parseLeaderboard } from "./schema";

export interface LeaderboardSnapshot {
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
  boards: Record<LeaderboardPeriod, Leaderboard>;
  /**
   * How many traders upstream listed for each period when the snapshot was
   * taken. The snapshot keeps only some of them, and the page says so.
   */
  upstreamTotals: Record<LeaderboardPeriod, number>;
}

const periodMetaSchema = z.object({ upstreamTotal: z.number().int().nonnegative() });

/** Parses the home boards out of a snapshot file; throws when it is broken (D-026). */
export function parseSnapshot(input: unknown): LeaderboardSnapshot {
  const file = parseSnapshotFile(input);

  const boards = {} as Record<LeaderboardPeriod, Leaderboard>;
  const upstreamTotals = {} as Record<LeaderboardPeriod, number>;

  for (const period of LEADERBOARD_PERIODS) {
    const rawPeriod = file.periods[period];
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
    capturedAt: file.capturedAt,
    boards,
    upstreamTotals,
  };
}

let saved: LeaderboardSnapshot | undefined;

/**
 * The committed snapshot, parsed on first use and kept: the file never changes
 * while the server runs. A broken snapshot fails loudly (D-026).
 */
export function loadSnapshot(): LeaderboardSnapshot {
  saved ??= parseSnapshot(SAVED_SNAPSHOT);
  return saved;
}
