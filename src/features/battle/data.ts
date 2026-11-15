// The head-to-head page's data. Server only.
//
// The pair is fixed, as on the source (BATTLE-04): one Polymarket trader and
// one Kalshi trader, the same two public profiles, without the source's host
// promotion (D-014). Everything shown comes from documented endpoints: the
// two trader records, the Kalshi history and Polymarket's P&L series.

import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { getProfile } from "@/features/profile/data";
import { loadKalshiHistory, loadPolymarketHistory } from "@/features/profile/history-data";
import type { TraderProfile } from "@/features/profile/model";

import { compare, type Comparison } from "./comparison";
import pair from "./pair.json";

/**
 * The source's pair, read off its battle page on 2026-11-13. Kept in
 * pair.json, which the fixture recording script reads too.
 */
export const BATTLE_PAIR: Readonly<{ polymarket: string; kalshi: string }> = pair;

export type BattlePlatform = keyof typeof BATTLE_PAIR;

export interface BattleSide {
  platform: BattlePlatform;
  /** The wallet or username the pair is defined by. */
  id: string;
  /** null when the trader record could not be loaded; the page then shows the id. */
  profile: TraderProfile | null;
}

export interface Battle {
  sides: [BattleSide, BattleSide];
  /** null when either history could not be loaded or they do not overlap. */
  comparison: Comparison | null;
}

async function side(platform: BattlePlatform): Promise<BattleSide> {
  const id = BATTLE_PAIR[platform];
  const result = await getProfile(id);
  return { platform, id, profile: result.kind === "found" ? result.profile : null };
}

async function comparison(): Promise<Comparison | null> {
  try {
    const [polymarket, kalshi] = await Promise.all([
      loadPolymarketHistory(BATTLE_PAIR.polymarket),
      loadKalshiHistory(BATTLE_PAIR.kalshi),
    ]);
    return compare(polymarket, kalshi);
  } catch (error) {
    console.error("Head-to-head histories: unavailable.", error);
    return null;
  }
}

/** Something the page needs could not be loaded. */
export class BattleUnavailableError extends Error {
  constructor() {
    super("The head-to-head data is incomplete right now");
    this.name = "BattleUnavailableError";
  }
}

/**
 * During a build, a failed request shows as a message in the card it affects,
 * so the build never fails because upstream is down. At any other time it
 * throws: Next.js then keeps serving the last complete page and tries again
 * on the next request, instead of caching a degraded one for five minutes.
 */
export async function getBattle(): Promise<Battle> {
  const [polymarket, kalshi, lines] = await Promise.all([side("polymarket"), side("kalshi"), comparison()]);
  const complete = polymarket.profile !== null && kalshi.profile !== null && lines !== null;
  if (!complete && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) throw new BattleUnavailableError();
  return { sides: [polymarket, kalshi], comparison: lines };
}
