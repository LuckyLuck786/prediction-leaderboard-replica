import Link from "next/link";

import { TraderAvatar } from "@/features/leaderboard/components/trader-avatar";
import { PlatformBadge, XBadge } from "@/features/leaderboard/components/platform-badge";
import {
  MISSING,
  formatCount,
  formatDrawdown,
  formatProfileMoney,
  formatScore,
  formatSharpe,
  formatTraderName,
  formatWinRate,
} from "@/features/leaderboard/format";
import { PLATFORM_NAMES, type FilterablePlatform } from "@/features/leaderboard/model";
import { scoreBandClass } from "@/features/leaderboard/score-band";
import { cn } from "@/lib/utils";

import { PROFILE_PERIODS, PROFILE_PERIOD_LABELS, type TraderProfile } from "../model";

/** PROF-09: the card accent follows the trader's main platform. */
const ACCENT: Record<TraderProfile["platform"], { text: string; border: string; chip: string }> = {
  polymarket: { text: "text-polymarket", border: "border-t-polymarket/50", chip: "bg-polymarket/10" },
  kalshi: { text: "text-kalshi", border: "border-t-kalshi/50", chip: "bg-kalshi/10" },
  both: { text: "text-polymarket", border: "border-t-polymarket/50", chip: "bg-polymarket/10" },
  hyperliquid: { text: "text-hyperliquid", border: "border-t-hyperliquid/50", chip: "bg-hyperliquid/10" },
};

const CARD = "rounded-lg border border-border border-t-2 bg-card p-4";

function platformLinks(profile: TraderProfile): Array<{ platform: FilterablePlatform; href: string }> {
  const links: Array<{ platform: FilterablePlatform; href: string | null }> = [
    { platform: "polymarket", href: profile.polymarketUrl },
    { platform: "kalshi", href: profile.kalshiUrl },
    { platform: "hyperliquid", href: profile.hyperliquidUrl },
  ];
  return links.filter((link): link is { platform: FilterablePlatform; href: string } => link.href !== null);
}

function platformLabel(profile: TraderProfile): string {
  return profile.platform === "both"
    ? `${PLATFORM_NAMES.polymarket} + ${PLATFORM_NAMES.kalshi}`
    : PLATFORM_NAMES[profile.platform];
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("text-base font-medium text-foreground", className)}>{value}</p>
    </div>
  );
}

export function ProfileView({ profile }: { profile: TraderProfile }) {
  const accent = ACCENT[profile.platform];
  const displayName = formatTraderName(profile.name);
  const meta = [
    profile.joined ? `Joined ${profile.joined}` : null,
    profile.views !== null ? `${formatCount(profile.views)} views` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="mb-8 flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 sm:h-[76px] sm:w-[76px]">
          <TraderAvatar name={profile.name} url={profile.avatarUrl} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold">{displayName}</h1>
            {platformLinks(profile).map((link) => (
              <a
                key={link.platform}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`View on ${PLATFORM_NAMES[link.platform]}`}
                aria-label={`View on ${PLATFORM_NAMES[link.platform]}`}
                className="hover:opacity-70"
              >
                <PlatformBadge platform={link.platform} />
              </a>
            ))}
            {profile.xUrl ? (
              <a
                href={profile.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${displayName} on X`}
                className="hover:opacity-70"
              >
                <XBadge />
              </a>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", accent.text, accent.chip)}>
              {platformLabel(profile)}
            </span>
            {meta.length > 0 ? <span className="text-muted-foreground">{meta.join(" · ")}</span> : null}
          </div>
          {profile.wallet ? (
            <p title={profile.wallet} className="mt-1 font-mono text-xs text-muted-foreground">
              {formatTraderName(profile.wallet)}
            </p>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="pnl-heading" className={cn(CARD, accent.border, "mb-6")}>
        <h2 id="pnl-heading" className="mb-3 text-sm text-muted-foreground">
          Profit and loss
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {PROFILE_PERIODS.map((period) => {
            const value = profile.pnl[period];
            return (
              <Stat
                key={period}
                label={PROFILE_PERIOD_LABELS[period]}
                value={value === null ? MISSING : formatProfileMoney(value)}
                className={value === null ? undefined : value < 0 ? "text-negative" : "text-positive"}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="score-heading" className={cn(CARD, accent.border, "mb-8")}>
        <h2 id="score-heading" className="mb-3 text-sm text-muted-foreground">
          Smart Score
        </h2>
        {profile.score ? (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatScore(profile.score.score)}</span>
              <span
                className={cn("rounded bg-muted px-2 py-0.5 text-sm", scoreBandClass(profile.score.score))}
              >
                {profile.score.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
              <Stat label="Win rate" value={formatWinRate(profile.score.winRate)} />
              <Stat label="Sharpe" value={formatSharpe(profile.score.sharpe)} />
              <Stat label="Max drawdown" value={formatDrawdown(profile.score.maxDrawdown)} />
              <Stat
                label="Profit factor"
                value={profile.score.profitFactor === null ? MISSING : profile.score.profitFactor.toFixed(2)}
              />
              <Stat label="R²" value={formatWinRate(profile.score.rSquared)} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not enough daily history for a score yet.</p>
        )}
      </section>

      <p className="text-center text-sm">
        <Link href="/" className="text-muted-foreground underline hover:text-foreground">
          Back to the leaderboard
        </Link>
      </p>
    </>
  );
}
