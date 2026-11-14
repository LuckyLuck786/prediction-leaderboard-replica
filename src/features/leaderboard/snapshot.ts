// The saved snapshot: what the site renders when live data is unavailable.
// It goes through the same parser as a live response.

import rawSnapshot from "@/upstream/snapshot/leaderboard.json";

import { LEADERBOARD_PERIODS, type Leaderboard, type LeaderboardPeriod } from "./model";
import { parseLeaderboard } from "./schema";

export interface LeaderboardSnapshot {
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
  /** Combined profit of all tracked traders on the snapshot day, in dollars. */
  dailyProfit: number;
  boards: Record<LeaderboardPeriod, Leaderboard>;
}

export function loadSnapshot(): LeaderboardSnapshot {
  const periods: Record<string, unknown> = rawSnapshot.periods;
  const boards = {} as Record<LeaderboardPeriod, Leaderboard>;

  for (const period of LEADERBOARD_PERIODS) {
    const result = parseLeaderboard(periods[period], period);
    if (!result.ok) {
      throw new Error(`Saved snapshot for period ${period} is invalid: ${result.error}`);
    }
    boards[period] = result.leaderboard;
  }

  return {
    capturedAt: rawSnapshot.capturedAt,
    dailyProfit: rawSnapshot.dailyProfit.raw,
    boards,
  };
}
