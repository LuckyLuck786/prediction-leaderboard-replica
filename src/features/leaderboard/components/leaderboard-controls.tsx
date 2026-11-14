"use client";

import type { Dispatch } from "react";

import { Chip } from "@/features/shell/chip";
import { ThemeToggle } from "@/features/shell/theme-toggle";
import { cn } from "@/lib/utils";

import {
  EXTRA_COLUMNS,
  EXTRA_COLUMN_LABELS,
  FILTERABLE_PLATFORMS,
  MIN_DAILY_MOVE_USD,
  PERIOD_BUTTONS,
  PLATFORM_NAMES,
  SCORE_WEIGHTS,
  type ExtraColumn,
} from "../model";
import type { LeaderboardAction, LeaderboardState } from "../state";
import { PlatformBadge } from "./platform-badge";

/** Tooltips. The ROI definition is the one given in the upstream API reference. */
const EXTRA_COLUMN_TITLES: Record<ExtraColumn, string> = {
  sharpe: "Sharpe ratio for the selected period",
  winRate: "Share of days that ended in profit",
  roi: "Polymarket traders only: all-time profit divided by everything staked. Deposits do not affect it.",
};

const SCORE_LEGEND = `Score blends ${new Intl.ListFormat("en-GB", {
  type: "conjunction",
}).format(SCORE_WEIGHTS.map((weight) => `${weight.part} ${weight.percent}%`))}.`;

export function LeaderboardControls({
  state,
  dispatch,
  countLabel,
}: {
  state: LeaderboardState;
  dispatch: Dispatch<LeaderboardAction>;
  /** "421 of 584 traders", or what is happening instead. */
  countLabel: string;
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
        <p className="text-sm">
          {countLabel}
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
                title={EXTRA_COLUMN_TITLES[column]}
                onClick={() => dispatch({ type: "toggleColumn", column })}
                className={cn(
                  "h-6 text-xs sm:h-6 sm:text-xs",
                  !extraColumns.includes(column) && "text-muted-foreground",
                )}
              >
                {EXTRA_COLUMN_LABELS[column]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[10px] text-muted-foreground sm:text-xs">
        {SCORE_LEGEND} Sharpe is return divided by volatility.
      </p>
    </div>
  );
}
