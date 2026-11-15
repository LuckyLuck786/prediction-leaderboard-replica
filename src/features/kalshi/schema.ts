// Boundary for the upstream Kalshi board (spec DATA-03). Upstream JSON is
// untrusted until it has passed through `parseKalshiBoard`.

import { z } from "zod";

import { isProfileId } from "@/features/profile/model";
import { cleanLinkUrl, safeHttpsUrl } from "@/upstream/urls";

import type { KalshiBoard, KalshiPeriod, KalshiTrader } from "./model";

const optionalString = z.string().nullish();

const rawTraderSchema = z.object({
  rank: z.number().int().positive(),
  kalshi_username: z.string().min(1),
  name: z.string().nullish(),
  pfp: optionalString,
  pnl: z.number(),
  profile_path: optionalString,
  kalshi_url: optionalString,
  x_handle: optionalString,
  sports_share: z.number().nullish(),
});

const envelopeSchema = z.object({
  lastUpdated: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "not a date"),
  traders: z.array(z.unknown()),
});

/** X allows letters, digits and underscores, up to 15 characters. */
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

function toTrader(raw: z.infer<typeof rawTraderSchema>): KalshiTrader {
  const username = raw.kalshi_username;
  return {
    rank: raw.rank,
    username,
    name: raw.name ? raw.name : username,
    avatarUrl: safeHttpsUrl(raw.pfp),
    pnl: raw.pnl,
    // Only trust the exact form upstream uses for its own profile pages, and
    // only for a username our profile route accepts (otherwise a 404).
    profileId: raw.profile_path === `/account/${username}` && isProfileId(username) ? username : null,
    kalshiUrl: cleanLinkUrl(raw.kalshi_url),
    xHandle: raw.x_handle && X_HANDLE.test(raw.x_handle) ? raw.x_handle : null,
    sportsShare: raw.sports_share ?? null,
  };
}

export type KalshiParseResult = { ok: true; board: KalshiBoard } | { ok: false; error: string };

/**
 * Same contract as the main leaderboard parser: a bad envelope fails, bad or
 * repeated entries are dropped and counted, and a list with no survivors fails.
 */
export function parseKalshiBoard(input: unknown, period: KalshiPeriod): KalshiParseResult {
  const envelope = envelopeSchema.safeParse(input);
  if (!envelope.success) return { ok: false, error: z.prettifyError(envelope.error) };

  const traders: KalshiTrader[] = [];
  const seen = new Set<string>();
  for (const candidate of envelope.data.traders) {
    const raw = rawTraderSchema.safeParse(candidate);
    if (!raw.success || seen.has(raw.data.kalshi_username)) continue;
    seen.add(raw.data.kalshi_username);
    traders.push(toTrader(raw.data));
  }

  const rejectedCount = envelope.data.traders.length - traders.length;
  if (traders.length === 0 && rejectedCount > 0) {
    return { ok: false, error: `None of the ${rejectedCount} traders matched the expected shape` };
  }

  return {
    ok: true,
    board: {
      period,
      lastUpdated: new Date(envelope.data.lastUpdated).toISOString(),
      traders,
      rejectedCount,
    },
  };
}
