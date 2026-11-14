// Boundary for GET /api/trader/{id} (spec DATA-04).

import { z } from "zod";

import { PLATFORMS } from "@/features/leaderboard/model";
import { cleanLinkUrl, safeHttpsUrl } from "@/upstream/urls";

import {
  PROFILE_PERIODS,
  WALLET,
  type ProfilePeriod,
  type TraderProfile,
} from "./model";

const optionalString = z.string().nullish();
const optionalNumber = z.number().nullish();

const rawProfileSchema = z.object({
  trader: z.object({
    name: z.string().min(1),
    platform: z.enum(PLATFORMS),
    wallet: optionalString,
    additional_wallets: z.array(z.string()).nullish(),
    kalshi_username: optionalString,
    pfp: optionalString,
    twitter: optionalString,
    join_date: optionalString,
    views: optionalNumber,
    smart_score: z
      .object({
        score: z.number().nullish(),
        tier: z.string().nullish(),
        winRate: optionalNumber,
        sharpeRatio: optionalNumber,
        maxDrawdownPercent: optionalNumber,
        profitFactor: optionalNumber,
        rSquared: optionalNumber,
      })
      .nullish(),
    stats: z.record(z.string(), z.object({ pnl: z.number() })).nullish(),
    polymarket_profile: optionalString,
    kalshi_profile: optionalString,
    hyperliquid_profile: optionalString,
  }),
});

/** Upstream sends Kalshi join dates already as "Nov 2024". */
const MONTH_YEAR = /^[A-Z][a-z]{2} \d{4}$/;
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toJoined(value: string | null | undefined): string | null {
  if (!value) return null;
  if (MONTH_YEAR.test(value)) return value;
  if (Number.isNaN(Date.parse(value))) return null;
  return MONTH_YEAR_FORMAT.format(new Date(value));
}

export type ProfileParseResult =
  { ok: true; profile: TraderProfile } | { ok: false; error: string };

export function parseProfile(input: unknown, id: string): ProfileParseResult {
  const parsed = rawProfileSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: z.prettifyError(parsed.error) };
  const raw = parsed.data.trader;
  // DATA-08: any score field can be missing. Without a score there is no card.
  const score = raw.smart_score;
  const scoreValue = score?.score ?? null;

  const pnl = Object.fromEntries(
    PROFILE_PERIODS.map((period) => [period, raw.stats?.[period]?.pnl ?? null]),
  ) as Record<ProfilePeriod, number | null>;

  return {
    ok: true,
    profile: {
      id,
      name: raw.name,
      platform: raw.platform,
      wallet: raw.wallet || null,
      // Only well-formed addresses: each one becomes a request to Polymarket.
      // Lowercased first, so one wallet written in two cases is fetched once.
      wallets: [
        ...new Set(
          [raw.wallet, ...(raw.additional_wallets ?? [])]
            .filter((wallet): wallet is string => typeof wallet === "string" && WALLET.test(wallet))
            .map((wallet) => wallet.toLowerCase()),
        ),
      ],
      kalshiUsername: raw.kalshi_username || null,
      avatarUrl: safeHttpsUrl(raw.pfp),
      xUrl: cleanLinkUrl(raw.twitter),
      joined: toJoined(raw.join_date),
      views: raw.views ?? null,
      pnl,
      score:
        score && scoreValue !== null
          ? {
              score: scoreValue,
              tier: score.tier || null,
              winRate: score.winRate ?? null,
              sharpe: score.sharpeRatio ?? null,
              maxDrawdown: score.maxDrawdownPercent ?? null,
              profitFactor: score.profitFactor ?? null,
              rSquared: score.rSquared ?? null,
            }
          : null,
      polymarketUrl: cleanLinkUrl(raw.polymarket_profile),
      kalshiUrl: cleanLinkUrl(raw.kalshi_profile),
      hyperliquidUrl: cleanLinkUrl(raw.hyperliquid_profile),
    },
  };
}
