import Link from "next/link";

import { TraderAvatar } from "@/features/trader/components/trader-avatar";
import { PlatformBadge, XBadge } from "@/features/trader/components/platform-badge";
import {
  MISSING,
  formatCount,
  formatDrawdown,
  formatScore,
  formatSharpe,
  formatTraderName,
  formatWholePercent,
} from "@/lib/format";
import { PLATFORM_NAMES, type FilterablePlatform } from "@/features/trader/platforms";
import { scoreBandClass } from "@/features/trader/score-band";
import { cn } from "@/lib/utils";

import type { CategoriesResult, HistoryResult } from "../history-data";
import type { TraderProfile } from "../model";
import { CategoryCard } from "./category-card";
import { HistoryHeading } from "./history-heading";
import { MonthStrip } from "./month-strip";
import { PnlChart } from "./pnl-chart";

const HISTORY_MESSAGES = {
  empty: "Not enough history to draw yet.",
  unsupported: "No documented history is available for this trader.",
  unavailable: "History is unavailable right now.",
} as const;

const KALSHI_HISTORY_NOTE = "Kalshi history starts when the data source began following this trader.";

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

/** The profile page body (spec 4.4), rendered on the server; the month strip and chart are client components. */
export function ProfileView({
  profile,
  history,
  categories,
  today,
}: {
  profile: TraderProfile;
  history: HistoryResult;
  categories: CategoriesResult;
  /** Today's UTC day, decided on the server. */
  today: string;
}) {
  // Month strip input: computed on the server, sent as plain pairs.
  const changes = history.kind === "ready" ? [...history.changes] : [];
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

      <MonthStrip changes={changes} today={today} accentBorder={accent.border} />

      <section aria-labelledby="history-heading" className="mb-6 rounded-lg border border-border bg-card p-4">
        <HistoryHeading note={profile.platform === "kalshi" ? KALSHI_HISTORY_NOTE : null} />
        {history.kind === "ready" && history.series.length > 1 ? (
          <PnlChart series={history.series} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {HISTORY_MESSAGES[history.kind === "ready" ? "empty" : history.kind]}
          </p>
        )}
      </section>

      {categories.kind === "ready" && categories.rows.length > 0 ? (
        <CategoryCard rows={categories.rows} />
      ) : categories.kind === "unavailable" ? (
        <p className="mb-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Categories are unavailable right now.
        </p>
      ) : null}

      <section aria-labelledby="score-heading" className={cn(CARD, accent.border, "mb-8")}>
        <h2 id="score-heading" className="mb-3 text-sm text-muted-foreground">
          Smart Score
        </h2>
        {profile.score ? (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatScore(profile.score.score)}</span>
              {profile.score.tier ? (
                <span
                  className={cn("rounded bg-muted px-2 py-0.5 text-sm", scoreBandClass(profile.score.score))}
                >
                  {profile.score.tier}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
              <Stat label="Win rate" value={formatWholePercent(profile.score.winRate)} />
              <Stat label="Sharpe" value={formatSharpe(profile.score.sharpe)} />
              <Stat label="Max drawdown" value={formatDrawdown(profile.score.maxDrawdown)} />
              <Stat
                label="Profit factor"
                value={profile.score.profitFactor === null ? MISSING : profile.score.profitFactor.toFixed(2)}
              />
              <Stat label="R²" value={formatWholePercent(profile.score.rSquared)} />
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
