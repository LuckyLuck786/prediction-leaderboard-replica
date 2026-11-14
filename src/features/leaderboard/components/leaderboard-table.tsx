"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { profilePath } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  formatDaysSince,
  formatMoney,
  formatMoneyCompact,
  formatMoverAmount,
  formatRoi,
  formatScore,
  formatSharpe,
  formatTraderName,
  formatWinRate,
} from "../format";
import {
  EXTRA_COLUMN_LABELS,
  PLATFORM_NAMES,
  SHARPE_HEADINGS,
  type ExtraColumn,
  type FilterablePlatform,
  type LeaderboardPeriod,
  type SortKey,
  type SortState,
  type Trader,
} from "../model";
import { scoreBandClass } from "../score-band";
import { PlatformBadge, XBadge } from "./platform-badge";
import { TraderAvatar } from "./trader-avatar";

const EXTRA_COLUMN_DEFS: Record<
  ExtraColumn,
  { heading: (period: LeaderboardPeriod) => string; cell: (trader: Trader) => string }
> = {
  sharpe: {
    heading: (period) => SHARPE_HEADINGS[period],
    cell: (trader) => formatSharpe(trader.sharpe),
  },
  winRate: {
    heading: () => EXTRA_COLUMN_LABELS.winRate,
    cell: (trader) => formatWinRate(trader.winRate),
  },
  roi: { heading: () => EXTRA_COLUMN_LABELS.roi, cell: (trader) => formatRoi(trader.roi) },
};

/**
 * HOME-10. Optional columns are a desktop feature: their toggles are hidden
 * below 640 px, so the columns are too. Otherwise a column switched on at
 * desktop width would be stuck on a narrow screen with no way to remove it.
 */
const EXTRA_COLUMN_VISIBILITY = "hidden sm:table-cell";

const SORT_ARROWS = { asc: "↓", desc: "↑" } as const;
const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

const BADGE_LINK = "flex shrink-0 items-center justify-center hover:opacity-70";

/** #, picture, trader, joined, score and P&L: the columns that are always there. */
const BASE_COLUMN_COUNT = 6;

/** A grey placeholder row with the height of a real one (61 px, 49 px on mobile). */
function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <tr aria-hidden className="h-[49px] border-b border-border sm:h-[61px]">
      <td colSpan={columnCount} className="p-1 sm:p-2">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 shrink-0 rounded-full bg-muted motion-safe:animate-pulse sm:h-10 sm:w-10" />
          <div className="h-4 w-1/3 bg-muted motion-safe:animate-pulse" />
          <div className="ml-auto h-4 w-1/5 bg-muted motion-safe:animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

/** Links inside a row must not also trigger the row's own navigation. */
const keepInsideRow = (event: MouseEvent) => event.stopPropagation();

function SortableHeader({
  sortKey,
  sort,
  onSort,
  className,
  children,
}: {
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  className: string;
  children: ReactNode;
}) {
  const direction = sort?.key === sortKey ? sort.direction : null;
  return (
    <th
      scope="col"
      aria-sort={direction ? ARIA_SORT[direction] : undefined}
      className={cn("p-0 font-normal", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="h-full w-full cursor-pointer whitespace-nowrap p-1 text-inherit [text-align:inherit] hover:bg-muted sm:p-2"
      >
        {children}
        {direction ? ` ${SORT_ARROWS[direction]}` : null}
      </button>
    </th>
  );
}

function platformsOf(trader: Trader): FilterablePlatform[] {
  return trader.platform === "both" ? ["polymarket", "kalshi"] : [trader.platform];
}

function PlatformLink({ trader, platform }: { trader: Trader; platform: FilterablePlatform }) {
  const label = `${formatTraderName(trader.name)} on ${PLATFORM_NAMES[platform]}`;
  const badge = <PlatformBadge platform={platform} />;

  // A Kalshi account has its own local profile page.
  if (platform === "kalshi" && trader.kalshiUsername) {
    return (
      <Link
        href={profilePath(trader.kalshiUsername)}
        onClick={keepInsideRow}
        title={label}
        aria-label={label}
        className={BADGE_LINK}
      >
        {badge}
      </Link>
    );
  }

  const external = platform === "polymarket" ? trader.polymarketUrl : trader.hyperliquidUrl;
  if (platform !== "kalshi" && external) {
    return (
      <a
        href={external}
        target="_blank"
        rel="noopener noreferrer"
        onClick={keepInsideRow}
        title={label}
        aria-label={label}
        className={BADGE_LINK}
      >
        {badge}
      </a>
    );
  }

  return <span title={PLATFORM_NAMES[platform]}>{badge}</span>;
}

function DayMoverLine({ trader }: { trader: Trader }) {
  const mover = trader.dayMover;
  if (!mover) return null;
  return (
    <div
      title={`Largest move today: ${mover.label} ${formatMoney(mover.change)}`}
      className="flex items-center justify-end gap-1 text-[10px] leading-5 font-normal text-muted-foreground sm:text-xs sm:leading-4"
    >
      {mover.iconUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- plain image on purpose: docs/DECISIONS.md, D-013 */}
          <img
            src={mover.iconUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-4 w-4 rounded-full object-cover"
          />
          {/* The picture replaces the label on screen; keep the label for screen readers. */}
          <span className="sr-only">{mover.label}</span>
        </>
      ) : (
        <span className="max-w-[80px] truncate sm:max-w-[120px]">{mover.label}</span>
      )}
      <span className={mover.change < 0 ? "text-negative" : "text-positive"}>
        {formatMoverAmount(mover.change)}
      </span>
    </div>
  );
}

export function LeaderboardTable({
  traders,
  period,
  asOf,
  extraColumns,
  sort,
  onSort,
  skeletonRows = 0,
}: {
  traders: readonly Trader[];
  period: LeaderboardPeriod;
  /** ISO timestamp of the data; "joined" is counted up to this moment. Null while loading. */
  asOf: string | null;
  extraColumns: readonly ExtraColumn[];
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  /** Placeholder rows to draw while the data loads (spec STATE-03). */
  skeletonRows?: number;
}) {
  const router = useRouter();
  const columnCount = BASE_COLUMN_COUNT + extraColumns.length;

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="w-6 p-1 text-left text-sm font-normal sm:w-12 sm:p-3 sm:text-lg">
            #
          </th>
          <th scope="col" className="w-7 p-0.5 sm:w-14 sm:p-2">
            <span className="sr-only">Picture</span>
          </th>
          <th scope="col" className="p-1 text-left text-sm font-normal sm:p-3 sm:text-lg">
            Trader
          </th>
          <SortableHeader
            sortKey="joined"
            sort={sort}
            onSort={onSort}
            className="hidden w-16 text-left text-base sm:text-lg md:table-cell"
          >
            Joined
          </SortableHeader>
          <SortableHeader
            sortKey="score"
            sort={sort}
            onSort={onSort}
            className="text-center text-lg sm:text-xl"
          >
            Score
          </SortableHeader>
          {extraColumns.map((column) => (
            <SortableHeader
              key={column}
              sortKey={column}
              sort={sort}
              onSort={onSort}
              className={cn("text-center text-sm sm:text-lg", EXTRA_COLUMN_VISIBILITY)}
            >
              {EXTRA_COLUMN_DEFS[column].heading(period)}
            </SortableHeader>
          ))}
          <SortableHeader
            sortKey="pnl"
            sort={sort}
            onSort={onSort}
            className="text-right text-sm sm:text-lg"
          >
            P&amp;L
          </SortableHeader>
        </tr>
      </thead>
      <tbody>
        {traders.map((trader, index) => {
          const displayName = formatTraderName(trader.name);
          return (
            <tr
              key={trader.id}
              onClick={() => router.push(profilePath(trader.id))}
              className="cursor-pointer border-b border-border hover:bg-accent/50"
            >
              <td className="p-1 text-sm sm:p-3 sm:text-lg">{index + 1}</td>
              <td className="p-0.5 sm:p-2">
                <div className="h-6 w-6 shrink-0 sm:h-10 sm:w-10">
                  <TraderAvatar name={trader.name} url={trader.avatarUrl} />
                </div>
              </td>
              <td className="p-1 sm:p-2">
                <div className="flex min-w-0 items-center gap-1 overflow-hidden sm:gap-2">
                  <Link
                    href={profilePath(trader.id)}
                    onClick={keepInsideRow}
                    title={trader.name}
                    className="min-w-0 max-w-[60px] truncate text-sm text-foreground hover:underline sm:max-w-none sm:text-lg"
                  >
                    {displayName}
                  </Link>
                  <div className="ml-0.5 flex shrink-0 gap-0.5 sm:ml-1.5 sm:gap-1">
                    {trader.xUrl ? (
                      <a
                        href={trader.xUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={keepInsideRow}
                        title={`${displayName} on X`}
                        aria-label={`${displayName} on X`}
                        className={BADGE_LINK}
                      >
                        <XBadge />
                      </a>
                    ) : null}
                    {platformsOf(trader).map((platform) => (
                      <PlatformLink key={platform} trader={trader} platform={platform} />
                    ))}
                  </div>
                </div>
              </td>
              <td className="hidden whitespace-nowrap p-2 text-left text-base text-muted-foreground sm:text-lg md:table-cell">
                {asOf ? formatDaysSince(trader.joinedAt, asOf) : null}
              </td>
              <td className="p-1 text-center sm:p-2">
                <span
                  title="Overall score, 0 to 100"
                  className={cn(
                    "text-lg font-medium sm:text-xl",
                    trader.score === null ? "text-foreground" : scoreBandClass(trader.score),
                  )}
                >
                  {formatScore(trader.score)}
                </span>
              </td>
              {extraColumns.map((column) => (
                <td
                  key={column}
                  className={cn("p-1 text-center text-sm sm:p-2 sm:text-lg", EXTRA_COLUMN_VISIBILITY)}
                >
                  {EXTRA_COLUMN_DEFS[column].cell(trader)}
                </td>
              ))}
              <td className="whitespace-nowrap p-1 text-right text-sm font-medium sm:p-2 sm:text-lg">
                <span className="hidden sm:inline">{formatMoney(trader.pnl)}</span>
                <span className="sm:hidden">{formatMoneyCompact(trader.pnl)}</span>
                {period === "1d" ? <DayMoverLine trader={trader} /> : null}
              </td>
            </tr>
          );
        })}
        {Array.from({ length: skeletonRows }, (_, index) => (
          <SkeletonRow key={`skeleton-${index}`} columnCount={columnCount} />
        ))}
      </tbody>
    </table>
  );
}
