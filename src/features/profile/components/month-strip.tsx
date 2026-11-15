"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type MouseEvent } from "react";

import {
  MISSING,
  formatSignedWhole,
  formatMonthTotal,
  formatProfileMoney,
} from "@/features/leaderboard/format";
import { cn } from "@/lib/utils";

import { summariseMonth, summariseYear, type DayCell } from "../history";
import { BAR_BACKGROUND, CELL_BACKGROUND, cellTextClass, signedTextClass } from "./tone-styles";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
type View = "daily" | "monthly";

const LEGEND = [
  { label: "Loss", swatch: "bg-negative/30" },
  { label: "~$0", swatch: "bg-muted" },
  { label: "Profit", swatch: "bg-positive/30" },
  { label: "Best", swatch: "bg-brand/60" },
] as const;

/** Months counted from year 0, so two months compare with < and >. */
const monthIndex = (year: number, month: number) => year * 12 + month;
const parseKey = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return { year, month: month - 1 };
};

function DayTile({ cell }: { cell: DayCell }) {
  const title =
    cell.future ? undefined : cell.change === null ? "No data" : formatSignedWhole(cell.change);
  return (
    <div
      title={title}
      className={cn(
        "flex aspect-square flex-col items-center justify-center rounded text-[10px]",
        CELL_BACKGROUND[cell.tone],
      )}
    >
      <span className={cn("text-xs font-medium", cell.future ? "text-muted-foreground" : cellTextClass(cell.tone))}>
        {cell.day}
      </span>
      {cell.future ? null : (
        <span
          className={cn(
            "text-[10px] font-bold leading-none",
            cellTextClass(cell.tone),
          )}
        >
          {cell.change === null ? MISSING : formatProfileMoney(cell.change)}
        </span>
      )}
    </div>
  );
}

/**
 * PROF-02 and PROF-03: the month's result in one line, which opens into a
 * calendar of daily results or a year of monthly ones.
 */
export function MonthStrip({
  changes,
  today,
  accentBorder,
}: {
  /** UTC day ("2026-11-14") to that day's change, oldest first. */
  changes: ReadonlyArray<readonly [string, number]>;
  /** Today's UTC day, from the server, so both sides agree. */
  today: string;
  /** Top border colour of the card, by platform. */
  accentBorder: string;
}) {
  const changeMap = new Map(changes);
  const current = parseKey(today);
  // The earliest day with a result, wherever it sits in the list (BUG-082).
  const earliest = changes.reduce<string | null>((min, [key]) => (min === null || key < min ? key : min), null);
  const first = earliest === null ? current : parseKey(earliest);

  const [cursor, setCursor] = useState(current);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<View>("daily");

  const month = summariseMonth(changeMap, cursor.year, cursor.month, today);
  const year = summariseYear(changeMap, cursor.year, today);
  const atStart = monthIndex(cursor.year, cursor.month) <= monthIndex(first.year, first.month);
  const atEnd = monthIndex(cursor.year, cursor.month) >= monthIndex(current.year, current.month);
  const label = `${MONTH_NAMES[cursor.month]} ${cursor.year}`;

  const step = (delta: number) => (event: MouseEvent) => {
    event.stopPropagation();
    const index = monthIndex(cursor.year, cursor.month) + delta;
    setCursor({ year: Math.floor(index / 12), month: index % 12 });
  };

  return (
    <section
      aria-label="Results by month"
      className={cn("mb-6 rounded-lg border border-t-2 border-border bg-card", accentBorder)}
    >
      <div
        onClick={() => setExpanded((open) => !open)}
        className="flex cursor-pointer items-center justify-between gap-3 p-3 hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={step(-1)}
            disabled={atStart}
            aria-label="Previous month"
            className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft aria-hidden className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="min-w-[80px] text-center text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <button
            type="button"
            onClick={step(1)}
            disabled={atEnd}
            aria-label="Next month"
            className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight aria-hidden className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-bold", month.total === null ? "text-muted-foreground" : signedTextClass(month.total))}>
            {month.total === null ? MISSING : formatSignedWhole(month.total)}
          </span>
          <span className="text-xs text-muted-foreground">
            {month.wins}W / {month.losses}L
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div aria-hidden className="hidden gap-0.5 sm:flex">
            {month.days
              .filter((cell) => !cell.future)
              .map((cell) => (
                <div
                  key={cell.key}
                  title={`Day ${cell.day}: ${cell.change === null ? "No data" : formatProfileMoney(cell.change)}`}
                  className={cn("h-4 w-2 rounded-sm", BAR_BACKGROUND[cell.tone])}
                />
              ))}
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide the calendar" : "Show the calendar"}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((open) => !open);
            }}
            className="rounded p-0.5 hover:bg-muted"
          >
            <ChevronDown
              aria-hidden
              className={cn("h-4 w-4 text-muted-foreground", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="px-3 pb-3">
          <div className="mb-2 mt-3 flex items-center justify-between">
            <div role="group" aria-label="Calendar view" className="inline-flex overflow-hidden rounded-md border border-border text-xs">
              {(["daily", "monthly"] as const).map((option, index) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={cn(
                    "px-2.5 py-1 font-medium capitalize",
                    index > 0 && "border-l border-border",
                    view === option ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {view === "daily" ? (
            <>
              <div aria-hidden className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((weekday, index) => (
                  <div key={index} className="text-center text-[10px] font-medium text-muted-foreground">
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: month.leadingBlanks }, (_, index) => (
                  <div key={`blank-${index}`} aria-hidden />
                ))}
                {month.days.map((cell) => (
                  <DayTile key={cell.key} cell={cell} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                {LEGEND.map((entry) => (
                  <span key={entry.label} className="flex items-center gap-1">
                    <span aria-hidden className={cn("h-2 w-2 rounded", entry.swatch)} />
                    {entry.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-col items-center text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">
                  {cursor.year} YTD
                </span>
                <span
                  className={cn(
                    "text-4xl font-extrabold leading-none tracking-tight sm:text-6xl",
                    year.total === null ? "text-muted-foreground" : signedTextClass(year.total),
                  )}
                >
                  {year.total === null ? MISSING : formatMonthTotal(year.total)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {year.months.map((entry) => {
                  const name = MONTH_NAMES[entry.month].toUpperCase();
                  return (
                    <div
                      key={entry.month}
                      title={`${name} ${cursor.year}: ${entry.total === null ? "No data" : formatSignedWhole(entry.total)}`}
                      className="flex aspect-[3/2] flex-col items-center justify-center rounded-lg border border-border/50"
                    >
                      <div className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground sm:text-sm">
                        {name}
                      </div>
                      <div
                        className={cn(
                          "text-base font-bold sm:text-xl",
                          entry.total === null ? "text-muted-foreground" : signedTextClass(entry.total),
                        )}
                      >
                        {entry.total === null ? MISSING : formatMonthTotal(entry.total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
