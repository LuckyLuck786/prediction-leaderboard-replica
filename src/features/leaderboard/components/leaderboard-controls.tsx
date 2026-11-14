"use client";

import type { Dispatch, ReactNode } from "react";

import { ThemeToggle } from "@/features/shell/theme-toggle";
import { cn } from "@/lib/utils";

import {
  EXTRA_COLUMNS,
  FILTERABLE_PLATFORMS,
  MIN_DAILY_MOVE_USD,
  PERIOD_BUTTONS,
  PLATFORM_NAMES,
  type ExtraColumn,
} from "../model";
import type { LeaderboardAction, LeaderboardState } from "../state";
import { PlatformBadge } from "./platform-badge";

const EXTRA_COLUMN_BUTTONS: Record<ExtraColumn, { label: string; title: string }> = {
  sharpe: { label: "Sharpe", title: "Sharpe ratio for the selected period" },
  winRate: { label: "Win%", title: "Share of days that ended in profit" },
  roi: {
    label: "ROI",
    title: "All-time Polymarket profit divided by everything staked. Deposits do not affect it.",
  },
};

// The source draws no border on its chips, so sizes match only without one.
const CHIP_ON = "bg-primary text-primary-foreground";
const CHIP_OFF = "text-foreground hover:bg-accent";

function Chip({
  active,
  title,
  onClick,
  className,
  children,
}: {
  active: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs sm:h-7 sm:text-sm",
        active ? CHIP_ON : CHIP_OFF,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function LeaderboardControls({
  state,
  dispatch,
  shownCount,
  totalCount,
}: {
  state: LeaderboardState;
  dispatch: Dispatch<LeaderboardAction>;
  shownCount: number;
  totalCount: number;
}) {
  const { period, query, extraColumns } = state;

  return (
    <div className="mb-3">
      <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="search"
          value={query.search}
          onChange={(event) =>
            dispatch({ type: "patchQuery", patch: { search: event.target.value } })
          }
          placeholder="Find a trader"
          aria-label="Find a trader by name or wallet"
          className="h-[30px] w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-ring sm:w-48"
        />
        <p aria-live="polite" className="text-sm">
          {shownCount} of {totalCount} traders
        </p>
        <div className="sm:ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">P&amp;L:</span>

        <div role="group" aria-label="Period" className="flex gap-1">
          {PERIOD_BUTTONS.map((button) => (
            <Chip
              key={button.period}
              active={period === button.period}
              onClick={() => dispatch({ type: "setPeriod", period: button.period })}
              className="px-2.5 font-medium sm:px-3"
            >
              {button.label}
            </Chip>
          ))}
        </div>

        {period === "1d" ? (
          <Chip
            active={query.bigMoversOnly}
            title={
              query.bigMoversOnly
                ? `Showing traders whose day moved $${MIN_DAILY_MOVE_USD} or more`
                : `Show only traders whose day moved $${MIN_DAILY_MOVE_USD} or more`
            }
            onClick={() =>
              dispatch({ type: "patchQuery", patch: { bigMoversOnly: !query.bigMoversOnly } })
            }
            className="sm:px-2.5"
          >
            ${MIN_DAILY_MOVE_USD}+
          </Chip>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Platform" className="flex w-fit items-center border border-border">
              {FILTERABLE_PLATFORMS.map((platform) => (
                <Chip
                  key={platform}
                  active={query.platform === platform}
                  title={`${PLATFORM_NAMES[platform]} traders`}
                  onClick={() => dispatch({ type: "patchQuery", patch: { platform } })}
                  className="px-1.5 sm:px-2"
                >
                  <PlatformBadge platform={platform} />
                  <span className="sr-only">{PLATFORM_NAMES[platform]}</span>
                </Chip>
              ))}
              <Chip
                active={query.platform === "all"}
                title="Every platform"
                onClick={() => dispatch({ type: "patchQuery", patch: { platform: "all" } })}
              >
                All
              </Chip>
            </div>

            <Chip
              active={query.linkedOnly}
              title={
                query.linkedOnly ? "Showing only traders with an X account" : "Showing every trader"
              }
              onClick={() =>
                dispatch({ type: "patchQuery", patch: { linkedOnly: !query.linkedOnly } })
              }
              className="sm:h-6"
            >
              <span aria-hidden className="text-[10px] font-bold leading-none">
                X
              </span>
              <span className="text-xs">linked</span>
            </Chip>

            <Chip
              active={query.hideSports}
              title={
                query.hideSports
                  ? "Hiding traders who earn most of their profit on sports"
                  : "Showing sports traders too"
              }
              onClick={() =>
                dispatch({ type: "patchQuery", patch: { hideSports: !query.hideSports } })
              }
            >
              <span className="text-xs">No sports</span>
            </Chip>

            <Chip
              active={query.hideEsports}
              title={
                query.hideEsports
                  ? "Hiding esports traders who have no X account"
                  : "Showing esports traders too"
              }
              onClick={() =>
                dispatch({ type: "patchQuery", patch: { hideEsports: !query.hideEsports } })
              }
            >
              <span className="text-xs">No esports</span>
            </Chip>
          </div>

          <div role="group" aria-label="Extra columns" className="hidden gap-1 sm:flex">
            {EXTRA_COLUMNS.map((column) => (
              <Chip
                key={column}
                active={extraColumns.includes(column)}
                title={EXTRA_COLUMN_BUTTONS[column].title}
                onClick={() => dispatch({ type: "toggleColumn", column })}
                className={cn(
                  "h-6 text-xs sm:h-6 sm:text-xs",
                  !extraColumns.includes(column) && "text-muted-foreground",
                )}
              >
                {EXTRA_COLUMN_BUTTONS[column].label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[10px] text-muted-foreground sm:text-xs">
        Score blends consistency 25%, returns 25%, win rate 20%, worst loss 15% and profit
        factor 15%. Sharpe is return divided by volatility.
      </p>
    </div>
  );
}
