// P&L history: a cumulative series, turned into what a profile shows (spec
// PROF-02 to PROF-04). Pure functions. Days are UTC days, so the server and
// the browser always agree on which day a change belongs to.

export interface SeriesPoint {
  /** Epoch milliseconds. */
  t: number;
  /** Cumulative profit and loss at that moment, in dollars. */
  v: number;
}

/** "2026-11-14": the UTC day a timestamp falls on. */
export function dayKey(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Adds cumulative series (several wallets, or Polymarket plus Kalshi) into one,
 * for the chart. At every timestamp present in any series, each series
 * contributes its latest value so far. Before its first point a series
 * contributes its first value: a Kalshi history starts at the trader's total
 * when tracking began, not at 0, and counting 0 before it would draw that
 * whole total as a jump on the first day.
 *
 * Assumption, not confirmed on the source (docs/EVALS.md): a trader on both
 * platforms is drawn this way; the source's own route for them is undocumented.
 */
export function combineSeries(series: readonly (readonly SeriesPoint[])[]): SeriesPoint[] {
  const nonEmpty = series.filter((points) => points.length > 0);
  if (nonEmpty.length <= 1) return nonEmpty[0] ? [...nonEmpty[0]] : [];

  const times = [...new Set(nonEmpty.flatMap((points) => points.map((point) => point.t)))].sort(
    (a, b) => a - b,
  );
  const cursors = nonEmpty.map(() => -1);
  return times.map((t) => {
    let total = 0;
    nonEmpty.forEach((points, index) => {
      while (cursors[index] + 1 < points.length && points[cursors[index] + 1].t <= t) {
        cursors[index] += 1;
      }
      total += points[Math.max(cursors[index], 0)].v;
    });
    return { t, v: total };
  });
}

const MS_PER_DAY = 86_400_000;

/** The UTC day before a day key. */
function previousDayKey(key: string): string {
  return dayKey(Date.parse(`${key}T00:00:00Z`) - MS_PER_DAY);
}

/**
 * The change in cumulative P&L on each UTC day: that day's last value minus
 * the previous day's last value. A day whose previous day has no data gets no
 * change at all ("No data"), rather than a jump that spans the gap.
 *
 * Checked against the source's calendar for one Kalshi trader: this
 * reproduces 9 of the 11 monthly totals it showed for 2026 to the dollar
 * (docs/EVALS.md, note 12).
 */
export function dailyChanges(series: readonly SeriesPoint[]): Map<string, number> {
  const closes = new Map<string, number>();
  for (const point of series) closes.set(dayKey(point.t), point.v);

  const changes = new Map<string, number>();
  for (const [key, close] of closes) {
    const previousClose = closes.get(previousDayKey(key));
    if (previousClose !== undefined) changes.set(key, close - previousClose);
  }
  return changes;
}

/**
 * Daily changes for a trader with several series: each series' own daily
 * changes, added up per day. Each series keeps its own gaps, so one series
 * starting late or missing a day never shows up as a jump in the total.
 */
export function sumDailyChanges(series: readonly (readonly SeriesPoint[])[]): Map<string, number> {
  const total = new Map<string, number>();
  for (const points of series) {
    for (const [key, change] of dailyChanges(points)) total.set(key, (total.get(key) ?? 0) + change);
  }
  return total;
}

/**
 * How a day cell is shaded. Read off the source's calendar for three months
 * (44 days, 2026-11-14): shading follows the size of the day's change in fixed
 * dollar steps, the same for gains and losses, and the month's best day is
 * marked on its own.
 */
export type DayTone = "none" | "flat" | "best" | `gain-${ToneLevel}` | `loss-${ToneLevel}`;
export type ToneLevel = 1 | 2 | 3 | 4 | 5;

/** A move smaller than this, either way, is shaded as flat. */
const FLAT_BELOW_USD = 100;
/** Lower bound of levels 2 to 5, in dollars. Level 1 starts at FLAT_BELOW_USD. */
const LEVEL_FROM_USD: ReadonlyArray<[ToneLevel, number]> = [
  [5, 10_000],
  [4, 5_000],
  [3, 2_000],
  [2, 500],
];

export function toneFor(change: number): DayTone {
  const size = Math.abs(change);
  if (size < FLAT_BELOW_USD) return "flat";
  const level = LEVEL_FROM_USD.find(([, from]) => size >= from)?.[0] ?? 1;
  return change > 0 ? `gain-${level}` : `loss-${level}`;
}

export interface DayCell {
  /** Day of the month, 1-based. */
  day: number;
  key: string;
  /** null: no data for that day. */
  change: number | null;
  /** A day after today: nothing to show yet. */
  future: boolean;
  tone: DayTone;
}

export interface MonthSummary {
  year: number;
  /** 0 = January. */
  month: number;
  /** Sum of the daily changes in the month; null when no day has data. */
  total: number | null;
  wins: number;
  losses: number;
  /** Empty cells before day 1 when weeks start on Sunday. */
  leadingBlanks: number;
  days: DayCell[];
}

/**
 * One calendar month. Wins and losses count every day that moved, however
 * little; the best gain is marked on its own (spec PROF-02, PROF-03).
 */
export function summariseMonth(
  changes: ReadonlyMap<string, number>,
  year: number,
  month: number,
  today: string,
): MonthSummary {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const raw = Array.from({ length: daysInMonth }, (_, index) => {
    const key = new Date(Date.UTC(year, month, index + 1)).toISOString().slice(0, 10);
    const future = key > today;
    return { day: index + 1, key, future, change: future ? null : (changes.get(key) ?? null) };
  });

  const changesInMonth = raw.flatMap((cell) => (cell.change === null ? [] : [cell.change]));
  const bestGain = Math.max(0, ...changesInMonth);
  let bestMarked = false;

  const days = raw.map((cell): DayCell => {
    let tone: DayTone;
    if (cell.change === null) tone = "none";
    else if (!bestMarked && bestGain > 0 && cell.change === bestGain) {
      tone = "best";
      bestMarked = true;
    } else tone = toneFor(cell.change);
    return { ...cell, tone };
  });

  return {
    year,
    month,
    total: changesInMonth.length > 0 ? changesInMonth.reduce((sum, change) => sum + change, 0) : null,
    wins: changesInMonth.filter((change) => change > 0).length,
    losses: changesInMonth.filter((change) => change < 0).length,
    leadingBlanks,
    days,
  };
}

export interface YearSummary {
  year: number;
  total: number | null;
  /** One entry per month up to today's month (all twelve for a past year). */
  months: Array<{ month: number; total: number | null }>;
}

/** The Monthly view: each month's total and the year-to-date total. */
export function summariseYear(
  changes: ReadonlyMap<string, number>,
  year: number,
  today: string,
): YearSummary {
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const lastMonth = year < todayYear ? 11 : todayMonth - 1;
  const months = Array.from({ length: lastMonth + 1 }, (_, month) => ({
    month,
    total: summariseMonth(changes, year, month, today).total,
  }));
  const known = months.filter((entry) => entry.total !== null);
  return {
    year,
    total: known.length > 0 ? known.reduce((sum, entry) => sum + (entry.total ?? 0), 0) : null,
    months,
  };
}

/** Space added above and below the data, as a share of its range. */
const VALUE_PADDING = 0.1;
/** Ticks the step is sized for; the axis then ends on the padded maximum. */
const VALUE_TICK_SPACES = 4;
/** Steps are rounded up to a multiple of this share of their order of magnitude. */
const STEP_ROUNDING = 0.05;
/**
 * A range smaller than this share of the values is float noise, drawn as a
 * flat line. Without it, a step below the values' precision would never move
 * the tick loop forward.
 */
const FLAT_RANGE_SHARE = 1e-9;
/** Upper bound on step ticks; the rounding above gives at most five. */
const MAX_STEP_TICKS = 10;

/**
 * A round step for a range, rounded up: 304,750 becomes 350,000 and 282,500
 * becomes 300,000, as the source's charts show.
 */
function roundStep(rough: number): number {
  const magnitude = 10 ** (Math.floor(Math.log10(rough)) + 1);
  return Math.ceil(rough / magnitude / STEP_ROUNDING - 1e-9) * STEP_ROUNDING * magnitude;
}

export interface ValueAxis {
  /** Lowest and highest value the plot shows, padded beyond the data. */
  min: number;
  max: number;
  ticks: number[];
}

/**
 * The value axis as the source draws it, worked out from two recorded charts:
 * the data range padded by a tenth on each side, ticks from the padded minimum
 * at a round step, and a last tick on the padded maximum.
 */
export function valueAxis(dataMin: number, dataMax: number): ValueAxis {
  const range = dataMax - dataMin;
  const flat = range <= Math.abs(dataMax) * FLAT_RANGE_SHARE;
  const spread = flat ? Math.abs(dataMax) || 1 : range;
  const min = dataMin - spread * VALUE_PADDING;
  const max = dataMax + spread * VALUE_PADDING;
  const step = roundStep((max - min) / VALUE_TICK_SPACES);
  const ticks: number[] = [];
  // The source keeps a step tick even when it lands close to the maximum.
  for (let index = 0; index < MAX_STEP_TICKS && min + index * step < max; index += 1) {
    ticks.push(min + index * step);
  }
  ticks.push(max);
  return { min, max, ticks };
}

/** Time-axis ticks: the first and last moment and evenly spaced ones between. */
export function timeTicks(first: number, last: number, count = 5): number[] {
  if (last <= first || count < 2) return [first];
  return Array.from({ length: count }, (_, index) => first + ((last - first) * index) / (count - 1));
}
