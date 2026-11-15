// Trader profile model (spec 4.4). The history behind PROF-02 to PROF-05
// lives in history.ts and history-data.ts.

import type { Platform } from "@/features/leaderboard/model";

/** The P&L periods a trader record carries. */
export const PROFILE_PERIODS = ["1d", "7d", "30d", "all"] as const;
export type ProfilePeriod = (typeof PROFILE_PERIODS)[number];

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
  /** Every Polymarket wallet of the trader, the main one first. */
  wallets: string[];
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

/** A Polymarket wallet address. */
export const WALLET = /^0x[0-9a-fA-F]{40}$/;

export function isProfileId(value: string): boolean {
  return PROFILE_ID.test(value);
}
