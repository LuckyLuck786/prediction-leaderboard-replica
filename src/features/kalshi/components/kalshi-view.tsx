"use client";

import Link from "next/link";
import { useState } from "react";

import { LocalStamp } from "@/features/leaderboard/components/local-stamp";
import { TraderAvatar } from "@/features/leaderboard/components/trader-avatar";
import { MISSING, formatMoneyWhole, formatStamp } from "@/features/leaderboard/format";
import { BRAND_MARK_PATH, PRODUCT_TAG } from "@/features/shell/brand";
import { Chip } from "@/features/shell/chip";
import { ThemeToggle } from "@/features/shell/theme-toggle";
import { usePeriodData } from "@/lib/use-period-data";
import { profilePath } from "@/lib/routes";

import { fetchKalshiBoard as fetchKalshiBoardFromApi } from "../board-api";
import type { KalshiPayload } from "../data";
import {
  DEFAULT_KALSHI_QUERY,
  KALSHI_PAGE_SIZE,
  KALSHI_PERIODS,
  KALSHI_SKELETON_ROWS,
  KALSHI_PERIOD_BUTTONS,
  type KalshiPeriod,
  type KalshiTrader,
} from "../model";
import { applyKalshiQuery } from "../query";

const EMPTY: never[] = [];
const COUNT_FORMAT = new Intl.NumberFormat("en-US");

function TraderName({ trader }: { trader: KalshiTrader }) {
  if (trader.profileId) {
    return (
      // No prefetch: a board shows dozens of profile links, and each prefetch
      // would render that profile on our server and ask upstream (D-048).
      <Link href={profilePath(trader.profileId)} prefetch={false} className="hover:underline">
        {trader.name}
      </Link>
    );
  }
  if (trader.kalshiUrl) {
    return (
      <a href={trader.kalshiUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {trader.name}
      </a>
    );
  }
  return <span>{trader.name}</span>;
}

/** A placeholder row with the height of a real one (spec STATE-03). */
function SkeletonRow() {
  return (
    <tr aria-hidden className="h-[49px] border-b border-border">
      <td colSpan={4} className="p-1 sm:p-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-muted motion-safe:animate-pulse sm:h-8 sm:w-8" />
          <div className="h-4 w-1/3 bg-muted motion-safe:animate-pulse" />
          <div className="ml-auto h-4 w-1/5 bg-muted motion-safe:animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export function KalshiView({
  initial,
  fetchBoard = fetchKalshiBoardFromApi,
}: {
  /** The board for the default period, rendered on the server. */
  initial: KalshiPayload;
  /** Loads the other periods. Replaced in tests. */
  fetchBoard?: (period: KalshiPeriod) => Promise<KalshiPayload>;
}) {
  const [period, setPeriod] = useState<KalshiPeriod>(initial.board.period);
  const [query, setQuery] = useState(DEFAULT_KALSHI_QUERY);
  const [visibleCount, setVisibleCount] = useState(KALSHI_PAGE_SIZE);
  const boards = usePeriodData({
    periods: KALSHI_PERIODS,
    initialPeriod: initial.board.period,
    initialValue: initial,
    fetchPeriod: fetchBoard,
    // KAL-07: each period is fetched when it is selected, as on the source.
    prefetch: false,
  });

  const current = boards.get(period);
  const payload = current.status === "ready" ? current.value : null;
  const traders = payload?.board.traders ?? EMPTY;
  // Filtering a thousand rows on every render is cheap, so it is not memoized.
  const matching = applyKalshiQuery(traders, query);
  const visible = matching.slice(0, visibleCount);

  const changeQuery = (patch: Partial<typeof query>) => {
    setQuery((previous) => ({ ...previous, ...patch }));
    setVisibleCount(KALSHI_PAGE_SIZE);
  };

  return (
    <>
      <header className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- a 24px local SVG needs no optimizer */}
            <img src={BRAND_MARK_PATH} alt="" width={24} height={24} className="h-6 w-6" />
            <h1 className="text-xl font-normal sm:text-2xl">Kalshi traders</h1>
            <span className="border border-border px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {PRODUCT_TAG}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="whitespace-nowrap border border-border px-3 py-1 text-sm hover:bg-accent"
            >
              All platforms
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          The 1,000 most profitable Kalshi traders, followed over time.
        </p>
        <p className="text-xs text-muted-foreground">
          Data as of {payload ? <LocalStamp iso={payload.board.lastUpdated} /> : MISSING}
        </p>
      </header>

      {payload?.source.kind === "snapshot" ? (
        <p role="status" className="mb-4 border border-border px-3 py-2 text-xs text-muted-foreground sm:text-sm">
          Live data is unavailable right now. Showing a saved snapshot from{" "}
          {formatStamp(payload.source.capturedAt, "UTC")} UTC: the top {payload.board.traders.length}{" "}
          of the {COUNT_FORMAT.format(payload.source.upstreamTotal)} traders listed for this period.
        </p>
      ) : null}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">P&amp;L:</span>
          <div role="group" aria-label="Period" className="flex gap-1">
            {KALSHI_PERIOD_BUTTONS.map((button) => (
              <Chip
                key={button.period}
                active={period === button.period}
                onClick={() => {
                  setPeriod(button.period);
                  setVisibleCount(KALSHI_PAGE_SIZE);
                  boards.request(button.period);
                }}
                className="px-2.5 font-medium sm:px-3"
              >
                {button.label}
              </Chip>
            ))}
          </div>
          <Chip
            active={query.nonSportsOnly}
            title="Only traders who make most of their profit outside sports"
            onClick={() => changeQuery({ nonSportsOnly: !query.nonSportsOnly })}
          >
            Non-sports
          </Chip>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={query.search}
            onChange={(event) => changeQuery({ search: event.target.value })}
            placeholder="Find a Kalshi trader"
            aria-label="Find a Kalshi trader by name"
            className="h-[30px] w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-ring sm:w-56"
          />
          <p className="whitespace-nowrap text-sm">
            {payload
              ? `${COUNT_FORMAT.format(matching.length)} traders`
              : current.status === "failed"
                ? "No traders loaded"
                : "Loading traders"}
          </p>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-border text-sm sm:text-lg">
            <th scope="col" className="w-10 p-1 text-left font-normal sm:w-16 sm:p-3">
              #
            </th>
            <th scope="col" className="w-9 p-0.5 sm:w-14 sm:p-2">
              <span className="sr-only">Picture</span>
            </th>
            <th scope="col" className="p-1 text-left font-normal sm:p-3">
              Trader
            </th>
            <th scope="col" className="p-1 text-right font-normal sm:p-3">
              P&amp;L
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((trader) => (
            <tr key={trader.username} className="h-[49px] border-b border-border">
              <td className="p-1 text-sm text-muted-foreground sm:p-3 sm:text-base">{trader.rank}</td>
              <td className="p-0.5 sm:p-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8">
                  <TraderAvatar name={trader.name} url={trader.avatarUrl} />
                </div>
              </td>
              <td className="truncate p-1 text-sm sm:p-3 sm:text-base">
                <TraderName trader={trader} />
                {trader.xHandle ? (
                  <span className="ml-2 text-xs text-muted-foreground">@{trader.xHandle}</span>
                ) : null}
              </td>
              <td
                className={`p-1 text-right text-sm tabular-nums sm:p-3 sm:text-base ${
                  trader.pnl < 0 ? "text-negative" : "text-positive"
                }`}
              >
                {formatMoneyWhole(trader.pnl)}
              </td>
            </tr>
          ))}
          {current.status === "loading"
            ? Array.from({ length: KALSHI_SKELETON_ROWS }, (_, index) => (
                <SkeletonRow key={`skeleton-${index}`} />
              ))
            : null}
        </tbody>
      </table>

      {current.status === "failed" ? (
        <div role="alert" className="py-8 text-center text-sm text-muted-foreground">
          <p>Could not load this period.</p>
          <button
            type="button"
            onClick={() => boards.retry(period)}
            className="mt-2 border border-border px-3 py-1 text-foreground hover:bg-accent"
          >
            Try again
          </button>
        </div>
      ) : null}

      {payload && matching.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No traders match.</p>
      ) : null}

      {visible.length < matching.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + KALSHI_PAGE_SIZE)}
          className="mt-2 h-9 w-full text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          Show more ({COUNT_FORMAT.format(matching.length - visible.length)} left)
        </button>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        The ranking follows Kalshi&apos;s public profiles. Day, week and month figures are the change
        between snapshots the data source takes every two hours, so they fill in over a
        trader&apos;s first days on the board.
      </p>
    </>
  );
}
