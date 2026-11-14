"use client";

import { useMemo, useReducer } from "react";

import { BRAND_MARK_PATH, PRODUCT_TAG } from "@/features/shell/brand";

import { formatMoneyWhole, formatStamp } from "../format";
import type { Leaderboard, LeaderboardPeriod, PlatformFilter } from "../model";
import { applyQuery } from "../query";
import { createInitialState, reduceLeaderboard } from "../state";
import { LeaderboardControls } from "./leaderboard-controls";
import { LeaderboardTable } from "./leaderboard-table";
import { LocalStamp } from "./local-stamp";

export function LeaderboardView({
  heading,
  description,
  boards,
  dailyProfit,
  snapshot,
  initialPlatform = "all",
}: {
  heading: string;
  description: string;
  boards: Record<LeaderboardPeriod, Leaderboard>;
  /** Combined profit of all tracked traders today, in dollars. */
  dailyProfit: number;
  /** Set when the page shows the saved snapshot rather than live data. */
  snapshot: {
    capturedAt: string;
    /** Traders upstream listed per period; the snapshot holds fewer. */
    upstreamTotals: Record<LeaderboardPeriod, number>;
  } | null;
  initialPlatform?: PlatformFilter;
}) {
  const [state, dispatch] = useReducer(reduceLeaderboard, initialPlatform, createInitialState);

  const board = boards[state.period];
  const matching = useMemo(
    () => applyQuery(board.traders, state.query, state.period),
    [board.traders, state.query, state.period],
  );
  const visible = matching.slice(0, state.visibleCount);

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
              Data as of <LocalStamp iso={board.lastUpdated} />
            </p>
          </div>
          <p className="text-lg font-semibold">
            Today:{" "}
            <span className={dailyProfit < 0 ? "text-negative" : "text-positive"}>
              {formatMoneyWhole(dailyProfit)}
            </span>
          </p>
        </div>
      </header>

      {snapshot ? (
        <p role="status" className="mb-4 border border-border px-3 py-2 text-xs text-muted-foreground sm:text-sm">
          Saved snapshot from {formatStamp(snapshot.capturedAt, "UTC")} UTC. It holds{" "}
          {board.traders.length} of the {snapshot.upstreamTotals[state.period]} traders listed
          for this period: the best and the worst by P&amp;L. This is not live data.
        </p>
      ) : null}

      <LeaderboardControls
        state={state}
        dispatch={dispatch}
        shownCount={matching.length}
        totalCount={board.traders.length}
      />

      <LeaderboardTable
        traders={visible}
        period={state.period}
        asOf={board.lastUpdated}
        extraColumns={state.extraColumns}
        sort={state.query.sort}
        onSort={(key) => dispatch({ type: "sortBy", key })}
      />

      {matching.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No traders match these filters.
        </p>
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
