"use client";

import { useReducer, type Dispatch } from "react";

import { BRAND_MARK_PATH, PRODUCT_TAG } from "@/features/shell/brand";
import { usePeriodData } from "@/lib/use-period-data";

import { fetchBoard as fetchBoardFromApi } from "../board-api";
import type { BoardPayload } from "../data";
import { MISSING, formatMoneyWhole, formatStamp } from "../format";
import { LEADERBOARD_PERIODS, PAGE_SIZE, type LeaderboardPeriod, type PlatformFilter } from "../model";
import { applyQuery } from "../query";
import { createInitialState, reduceLeaderboard, type LeaderboardAction } from "../state";
import { LeaderboardControls } from "./leaderboard-controls";
import { LeaderboardTable } from "./leaderboard-table";
import { LocalStamp } from "./local-stamp";

const EMPTY: never[] = [];
const COUNT_LABELS = { loading: "Loading traders", failed: "No traders loaded" } as const;

/** The whole board: controls, count, table and "Show more", loading other periods from our route (D-029). */
export function LeaderboardView({
  heading,
  description,
  initial,
  dailyProfit,
  initialPlatform = "all",
  fetchBoard = fetchBoardFromApi,
}: {
  heading: string;
  description: string;
  /** The board for the default period, rendered on the server. */
  initial: BoardPayload;
  /** Combined profit of all tracked traders today, in dollars; null when unavailable. */
  dailyProfit: number | null;
  initialPlatform?: PlatformFilter;
  /** Loads the other periods. Replaced in tests. */
  fetchBoard?: (period: LeaderboardPeriod) => Promise<BoardPayload>;
}) {
  const [state, dispatch] = useReducer(reduceLeaderboard, initialPlatform, createInitialState);
  const boards = usePeriodData({
    periods: LEADERBOARD_PERIODS,
    initialPeriod: initial.board.period,
    initialValue: initial,
    fetchPeriod: fetchBoard,
    prefetch: true,
  });

  const current = boards.get(state.period);
  const payload = current.status === "ready" ? current.value : null;
  const traders = payload?.board.traders ?? EMPTY;

  // Filtering and sorting a few hundred rows on every render is cheap, so it is not memoized.
  const matching = applyQuery(traders, state.query, state.period);
  const visible = matching.slice(0, state.visibleCount);
  // The day's total is live data; next to snapshot rows it would mix two moments.
  const shownDailyProfit = payload?.source.kind === "live" ? dailyProfit : null;

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- a 24px local SVG needs no optimizer */}
          <img src={BRAND_MARK_PATH} alt="" width={24} height={24} className="h-6 w-6" />
          <h1 className="text-xl font-normal sm:text-2xl">{heading}</h1>
          <span className="border border-border px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {PRODUCT_TAG}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-xs text-muted-foreground">
              Data as of {payload ? <LocalStamp iso={payload.board.lastUpdated} /> : MISSING}
            </p>
          </div>
          <p className="text-lg font-semibold">
            Today:{" "}
            {shownDailyProfit === null ? (
              <span className="text-muted-foreground">{MISSING}</span>
            ) : (
              <span className={shownDailyProfit < 0 ? "text-negative" : "text-positive"}>
                {formatMoneyWhole(shownDailyProfit)}
              </span>
            )}
          </p>
        </div>
      </header>

      {payload?.source.kind === "snapshot" ? (
        <p
          role="status"
          className="mb-4 border border-border px-3 py-2 text-xs text-muted-foreground sm:text-sm"
        >
          Live data is unavailable right now. Showing a saved snapshot from{" "}
          {formatStamp(payload.source.capturedAt, "UTC")} UTC: {payload.board.traders.length} of the{" "}
          {payload.source.upstreamTotal} traders listed for this period, the best and the worst by P&amp;L.
        </p>
      ) : null}

      <LeaderboardControls
        state={state}
        dispatch={dispatch as Dispatch<LeaderboardAction>}
        countLabel={
          payload
            ? `${matching.length} of ${traders.length} traders`
            : current.status === "failed"
              ? COUNT_LABELS.failed
              : COUNT_LABELS.loading
        }
      />

      <LeaderboardTable
        traders={visible}
        period={state.period}
        asOf={payload?.board.lastUpdated ?? null}
        extraColumns={state.extraColumns}
        sort={state.query.sort}
        onSort={(key) => dispatch({ type: "sortBy", key })}
        skeletonRows={current.status === "loading" ? PAGE_SIZE : 0}
      />

      {current.status === "failed" ? (
        <div role="alert" className="py-8 text-center text-sm text-muted-foreground">
          <p>Could not load this period.</p>
          <button
            type="button"
            onClick={() => boards.retry(state.period)}
            className="mt-2 border border-border px-3 py-1 text-foreground hover:bg-accent"
          >
            Try again
          </button>
        </div>
      ) : null}

      {payload && matching.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No traders match these filters.</p>
      ) : null}

      {visible.length < matching.length ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "showMore" })}
          className="mt-2 h-9 w-full text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          Show more ({visible.length} of {matching.length})
        </button>
      ) : null}
    </>
  );
}
