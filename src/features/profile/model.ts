// Trader profile model (spec 4.4). Phase 3 covers PROF-01, PROF-07, PROF-08,
// PROF-09 and PROF-10; the month strip, history chart and categories follow.

import type { Platform } from "@/features/leaderboard/model";

export const PROFILE_PERIODS = ["1d", "7d", "30d", "all"] as const;
export type ProfilePeriod = (typeof PROFILE_PERIODS)[number];

export const PROFILE_PERIOD_LABELS: Record<ProfilePeriod, string> = {
  "1d": "Today",
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

export interface SmartScore {
  score: number;
  /** "Great", "Risky" and so on; null when upstream sends none. */
  tier: string | null;
  winRate: number | null;
  sharpe: number | null;
  /** Worst peak-to-trough fall, as a fraction. */
  maxDrawdown: number | null;
  profitFactor: number | null;
  /** How closely the P&L curve follows a straight line, 0 to 1. */
  rSquared: number | null;
}

export interface TraderProfile {
  id: string;
  name: string;
  platform: Platform;
  wallet: string | null;
  kalshiUsername: string | null;
  avatarUrl: string | null;
  xUrl: string | null;
  /** "Nov 2024", or null when unknown. */
  joined: string | null;
  views: number | null;
  /** Profit and loss per period, in dollars; null when upstream has none. */
  pnl: Record<ProfilePeriod, number | null>;
  score: SmartScore | null;
  polymarketUrl: string | null;
  kalshiUrl: string | null;
  hyperliquidUrl: string | null;
}

/**
 * A Polymarket wallet, or a Kalshi username as the source's sitemap uses them.
 * An id made only of dots is refused: "." and ".." would turn
 * /api/trader/{id} into another upstream path.
 */
const PROFILE_ID = /^(0x[0-9a-fA-F]{40}|(?!\.+$)[A-Za-z0-9._-]{1,64})$/;

export function isProfileId(value: string): boolean {
  return PROFILE_ID.test(value);
}
