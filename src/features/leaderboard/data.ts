// Live leaderboard data, with the saved snapshot as the fallback. Server only.

import "server-only";

import { z } from "zod";

import { fetchUpstreamJson } from "@/upstream/client";
import type { DataSource } from "@/upstream/data-source";

import type { Leaderboard, LeaderboardPeriod } from "./model";
import { parseLeaderboard } from "./schema";
import { loadSnapshot } from "./snapshot";

export interface BoardPayload {
  board: Leaderboard;
  source: DataSource;
}

/**
 * One period of the leaderboard. Live data when upstream answers with
 * something that passes the schema; otherwise the saved snapshot, labelled as
 * such. The reason is logged on the server, not shown to visitors.
 */
export async function getBoard(period: LeaderboardPeriod): Promise<BoardPayload> {
  try {
    const body = await fetchUpstreamJson(`/api/leaderboard?period=${period}`);
    const parsed = parseLeaderboard(body, period);
    if (!parsed.ok) throw new Error(`Leaderboard ${period} failed validation: ${parsed.error}`);
    if (parsed.leaderboard.rejectedCount > 0) {
      console.warn(
        `Leaderboard ${period}: dropped ${parsed.leaderboard.rejectedCount} traders that did not match the schema.`,
      );
    }
    return { board: parsed.leaderboard, source: { kind: "live" } };
  } catch (error) {
    console.error(`Leaderboard ${period}: live data unavailable, serving the snapshot.`, error);
    const snapshot = loadSnapshot();
    return {
      board: snapshot.boards[period],
      source: {
        kind: "snapshot",
        capturedAt: snapshot.capturedAt,
        upstreamTotal: snapshot.upstreamTotals[period],
      },
    };
  }
}

const dailyProfitSchema = z.object({ raw: z.number() });

/**
 * Combined profit of every tracked trader today, in dollars, or null when it
 * is unavailable. Never mixed with snapshot data: a stale total next to live
 * rows would be misleading.
 */
export async function getDailyProfit(): Promise<number | null> {
  try {
    const parsed = dailyProfitSchema.safeParse(await fetchUpstreamJson("/api/daily-profit"));
    if (!parsed.success) throw new Error(`Daily profit failed validation: ${z.prettifyError(parsed.error)}`);
    return parsed.data.raw;
  } catch (error) {
    console.error("Daily profit unavailable.", error);
    return null;
  }
}
