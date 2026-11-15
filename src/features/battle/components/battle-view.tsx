import { XBadge } from "@/features/leaderboard/components/platform-badge";
import { TraderAvatar } from "@/features/leaderboard/components/trader-avatar";
import { formatChartDate, formatTraderName } from "@/features/leaderboard/format";
import { PLATFORM_NAMES } from "@/features/leaderboard/model";
import { cn } from "@/lib/utils";

import type { Battle, BattlePlatform, BattleSide } from "../data";
import { BattleFooter } from "./battle-footer";
import { BattleChart, type ChartLine } from "./battle-chart";

/** Platform colors for the ring, label, legend and line (BATTLE-02, BATTLE-03). */
const PLATFORM_STYLE: Record<BattlePlatform, { ring: string; text: string; stroke: string; fill: string; dash: string }> = {
  polymarket: {
    ring: "border-polymarket/50",
    text: "text-polymarket",
    stroke: "stroke-polymarket",
    fill: "fill-polymarket",
    dash: "bg-polymarket",
  },
  kalshi: {
    ring: "border-kalshi",
    text: "text-kalshi",
    stroke: "stroke-kalshi",
    fill: "fill-kalshi",
    dash: "bg-kalshi",
  },
};

function displayName(side: BattleSide): string {
  return formatTraderName(side.profile?.name ?? side.id);
}

/** Where a trader's name points: their page on the platform, or ours when that is unknown. */
function platformHref(side: BattleSide): string {
  const url = side.platform === "polymarket" ? side.profile?.polymarketUrl : side.profile?.kalshiUrl;
  return url ?? `/account/${encodeURIComponent(side.id)}`;
}

function Trader({ side }: { side: BattleSide }) {
  const style = PLATFORM_STYLE[side.platform];
  const name = displayName(side);
  const href = platformHref(side);
  const external = href.startsWith("https://");
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className={cn("h-24 w-24 overflow-hidden rounded-full border-2 md:h-32 md:w-32", style.ring)}>
        <TraderAvatar name={name} url={side.profile?.avatarUrl ?? null} />
      </div>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="mt-3 max-w-full truncate text-lg font-semibold hover:underline"
      >
        @{name}
      </a>
      <span className={cn("mt-1 text-xs font-medium", style.text)}>{PLATFORM_NAMES[side.platform]}</span>
      {side.profile?.xUrl ? (
        <a
          href={side.profile.xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} on X`}
          // 10 px, not 8: the source's card is 272 px high with the same parts.
          className="mt-2.5 hover:opacity-70"
        >
          <XBadge />
        </a>
      ) : null}
    </div>
  );
}

/** The head-to-head page body (spec 4.5). */
export function BattleView({ battle }: { battle: Battle }) {
  const line = (side: BattleSide): ChartLine => ({
    key: side.platform,
    name: `@${displayName(side)}`,
    stroke: PLATFORM_STYLE[side.platform].stroke,
    fill: PLATFORM_STYLE[side.platform].fill,
  });
  const lines: [ChartLine, ChartLine] = [line(battle.sides[0]), line(battle.sides[1])];

  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold">Head to head</h1>
      <p className="mb-8 text-center leading-snug text-muted-foreground">
        One Polymarket trader against one Kalshi trader
      </p>

      <section aria-label="The two traders" className="mb-6 rounded-lg border border-border bg-card p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Trader side={battle.sides[0]} />
          <span aria-hidden className="text-3xl font-bold text-muted-foreground">
            VS
          </span>
          <Trader side={battle.sides[1]} />
        </div>
      </section>

      <section aria-labelledby="change-heading" className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 id="change-heading" className="text-sm font-medium text-muted-foreground">
            Change in P&amp;L
          </h2>
          <ul aria-label="Legend" className="flex items-center gap-4 text-xs text-muted-foreground">
            {lines.map((line) => (
              <li key={line.key} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("h-0.5 w-3", PLATFORM_STYLE[line.key].dash)} />
                {line.name}
              </li>
            ))}
          </ul>
        </div>
        {battle.comparison ? (
          <>
            <BattleChart comparison={battle.comparison} lines={lines} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Profit or loss since {formatChartDate(battle.comparison.start)}, the first day both
              traders were tracked.
            </p>
          </>
        ) : (
          // Same height as the chart, so the page does not jump when it is back.
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            The comparison is unavailable right now.
          </p>
        )}
      </section>

      <BattleFooter />
    </>
  );
}
