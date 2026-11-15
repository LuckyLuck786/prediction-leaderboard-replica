// The boundary between upstream JSON and the app. Everything upstream sends
// is untrusted until it has passed through `parseLeaderboard`.

import { z } from "zod";

import { isProfileId } from "@/features/profile/model";
import { cleanLinkUrl, safeHttpsUrl } from "@/upstream/urls";

import {
  PLATFORMS,
  type DayMover,
  type Leaderboard,
  type LeaderboardPeriod,
  type Trader,
} from "./model";

const optionalNumber = z.number().nullish();
const optionalString = z.string().nullish();

const rawSmartScoreSchema = z.object({
  score: z.number(),
  winRate: optionalNumber,
  sharpeRatio: optionalNumber,
  sharpe1d: optionalNumber,
  sharpe1m: optionalNumber,
});

const rawTraderSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(PLATFORMS),
  wallet: optionalString,
  kalshi_username: optionalString,
  pfp: optionalString,
  twitter: optionalString,
  join_date: optionalString,
  stats: z.object({ pnl: z.number() }),
  smart_score: rawSmartScoreSchema.nullish(),
  roi: optionalNumber,
  sports_share: optionalNumber,
  esports_share: optionalNumber,
  day_mover: z
    .object({ label: z.string(), change: z.number(), icon: optionalString })
    .nullish(),
  polymarket_profile: optionalString,
  hyperliquid_profile: optionalString,
});

type RawTrader = z.infer<typeof rawTraderSchema>;
type RawSmartScore = z.infer<typeof rawSmartScoreSchema>;

const isDateString = (value: string) => !Number.isNaN(Date.parse(value));

const envelopeSchema = z.object({
  lastUpdated: z.string().refine(isDateString, "lastUpdated is not a date"),
  traders: z.array(z.unknown()),
});

/** Which upstream Sharpe figure belongs to which period. */
const SHARPE_FIELD: Record<LeaderboardPeriod, keyof RawSmartScore> = {
  "1d": "sharpe1d",
  "30d": "sharpe1m",
  ytd: "sharpeRatio",
  all: "sharpeRatio",
};

/** Upstream uses both null and "" for "no value". */
function presentOrNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

function toDayMover(raw: RawTrader["day_mover"]): DayMover | null {
  if (!raw) return null;
  return {
    label: raw.label,
    change: raw.change,
    iconUrl: safeHttpsUrl(raw.icon),
  };
}

function toTrader(raw: RawTrader, period: LeaderboardPeriod): Trader | null {
  const wallet = presentOrNull(raw.wallet);
  const rawUsername = presentOrNull(raw.kalshi_username);
  // The username links to a local profile, so only one our routes accept.
  const kalshiUsername = rawUsername && isProfileId(rawUsername) ? rawUsername : null;
  const id = wallet ?? rawUsername;
  if (!id) return null;
  const profileId = isProfileId(id) ? id : null;

  const joinDate = presentOrNull(raw.join_date);
  const score = raw.smart_score ?? null;

  return {
    id,
    profileId,
    name: raw.name,
    platform: raw.platform,
    wallet,
    kalshiUsername,
    avatarUrl: safeHttpsUrl(raw.pfp),
    xUrl: cleanLinkUrl(raw.twitter),
    joinedAt:
      joinDate && isDateString(joinDate) ? new Date(joinDate).toISOString() : null,
    pnl: raw.stats.pnl,
    score: score?.score ?? null,
    winRate: score?.winRate ?? null,
    sharpe: score?.[SHARPE_FIELD[period]] ?? null,
    roi: raw.roi ?? null,
    sportsShare: raw.sports_share ?? null,
    esportsShare: raw.esports_share ?? null,
    dayMover: toDayMover(raw.day_mover),
    polymarketUrl: cleanLinkUrl(raw.polymarket_profile),
    hyperliquidUrl: cleanLinkUrl(raw.hyperliquid_profile),
  };
}

export type ParseResult =
  | { ok: true; leaderboard: Leaderboard }
  | { ok: false; error: string };

/**
 * Validates one upstream leaderboard response.
 *
 * The envelope must be valid. Individual traders that do not match are
 * dropped and counted, so one odd entry cannot blank the page. A response in
 * which no trader survives is an error.
 */
export function parseLeaderboard(
  input: unknown,
  period: LeaderboardPeriod,
): ParseResult {
  const envelope = envelopeSchema.safeParse(input);
  if (!envelope.success) {
    return { ok: false, error: z.prettifyError(envelope.error) };
  }

  const traders: Trader[] = [];
  // The id is the profile route and the row key, so it must be unique. A
  // second entry with an id already seen is dropped and counted.
  const seenIds = new Set<string>();
  for (const candidate of envelope.data.traders) {
    const raw = rawTraderSchema.safeParse(candidate);
    const trader = raw.success ? toTrader(raw.data, period) : null;
    if (!trader || seenIds.has(trader.id)) continue;
    seenIds.add(trader.id);
    traders.push(trader);
  }

  const rejectedCount = envelope.data.traders.length - traders.length;
  if (traders.length === 0 && rejectedCount > 0) {
    return {
      ok: false,
      error: `None of the ${rejectedCount} traders matched the expected shape`,
    };
  }

  return {
    ok: true,
    leaderboard: {
      period,
      lastUpdated: new Date(envelope.data.lastUpdated).toISOString(),
      traders,
      rejectedCount,
    },
  };
}
