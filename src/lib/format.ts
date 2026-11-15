// Display formats for every page. Each rule mirrors a format observed on
// the source site; the IDs refer to docs/SPEC.md, section 3.3.

/** Shown wherever a value is missing. */
export const MISSING = "–";

const MS_PER_DAY = 86_400_000;
const THOUSAND = 1_000;
const MILLION = 1_000_000;
/**
 * Mobile rows shorten amounts from here up. Observed: 57.6K stayed full and
 * 349.8K was short, so the real switch lies between the two. Assumed.
 */
const COMPACT_ROW_FROM = 100_000;
const WALLET_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const WALLET_HEAD_LENGTH = 6;
const WALLET_TAIL_LENGTH = 4;

const COUNT_FORMAT = new Intl.NumberFormat("en-US");

const STAMP_PARTS = {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
} as const;

/** Short units: decimals for millions and thousands, and how small amounts are written. */
interface Units {
  millions: number;
  thousands: number;
  /** The thousands letter: the mobile rows write `k`, everything else `K`. */
  k: "K" | "k";
  /** false keeps amounts under a thousand in K (`+$0.5K`), as the head-to-head chart writes them. */
  wholeBelowThousand: boolean;
}

/**
 * How a dollar amount is written. Every money format on the site is one of
 * these: `full` writes the whole amount with separators, `units` shortens it
 * to M, K or whole dollars.
 */
type MoneyStyle = {
  /** Where a loss puts its minus: the boards write `$-21,622.00`, profiles `-$629`. */
  loss: "after-dollar" | "before-dollar";
} & ({ full: { decimals: 0 | 2 } } | { units: Units });

const GROUPED = {
  0: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
  2: new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
} as const;

/** M, K or whole dollars. The unit is chosen on the rounded figure, so 999,960 is never "1000.0K". */
function shortened(amount: number, units: Units): string {
  const thousands = (amount / THOUSAND).toFixed(units.thousands);
  if (Number(thousands) >= THOUSAND) return `${(amount / MILLION).toFixed(units.millions)}M`;
  if (!units.wholeBelowThousand || Math.round(amount) >= THOUSAND) return `${thousands}${units.k}`;
  return String(Math.round(amount));
}

/** The one money formatter: each exported money format below is a style of it. */
function formatUsd(value: number, style: MoneyStyle): string {
  let digits: string;
  let isLoss: boolean;
  if ("full" in style) {
    const scale = 10 ** style.full.decimals;
    // Rounded with its sign, so an amount that rounds to zero is not a loss.
    const rounded = Math.round(value * scale);
    digits = GROUPED[style.full.decimals].format(Math.abs(rounded) / scale);
    isLoss = rounded < 0;
  } else {
    digits = shortened(Math.abs(value), style.units);
    // A loss that rounds to nothing is shown as a gain: never "-$0" or "$-0.0K".
    isLoss = value < 0 && Number(digits.replace(/[KkM]$/, "")) !== 0;
  }
  if (!isLoss) return `+$${digits}`;
  return style.loss === "after-dollar" ? `$-${digits}` : `-$${digits}`;
}

const BOARD_CENTS: MoneyStyle = { loss: "after-dollar", full: { decimals: 2 } };
const BOARD_WHOLE: MoneyStyle = { loss: "after-dollar", full: { decimals: 0 } };
const BOARD_SHORT: MoneyStyle = {
  loss: "after-dollar",
  units: { millions: 1, thousands: 0, k: "k", wholeBelowThousand: true },
};
const PROFILE: MoneyStyle = {
  loss: "before-dollar",
  units: { millions: 1, thousands: 1, k: "K", wholeBelowThousand: true },
};
const PROFILE_TITLE: MoneyStyle = {
  loss: "before-dollar",
  units: { millions: 2, thousands: 1, k: "K", wholeBelowThousand: true },
};
const CALENDAR_DAY: MoneyStyle = { loss: "before-dollar", full: { decimals: 0 } };
const CALENDAR_MONTH: MoneyStyle = {
  loss: "before-dollar",
  units: { millions: 2, thousands: 2, k: "K", wholeBelowThousand: true },
};
/** Chart labels and day-mover amounts are written alike. */
const SHORT_WHOLE_K: MoneyStyle = {
  loss: "before-dollar",
  units: { millions: 1, thousands: 0, k: "K", wholeBelowThousand: true },
};
const BATTLE: MoneyStyle = {
  loss: "after-dollar",
  units: { millions: 1, thousands: 1, k: "K", wholeBelowThousand: false },
};

/**
 * FMT-01. `+$57,643.38`; negatives keep the source's order: `$-21,622.00`.
 * An amount that rounds to zero is shown as `+$0.00`.
 */
export function formatMoney(value: number): string {
  return formatUsd(value, BOARD_CENTS);
}

/** FMT-05. Whole dollars: `+$7,943,912`. Negatives follow FMT-01. */
export function formatMoneyWhole(value: number): string {
  return formatUsd(value, BOARD_WHOLE);
}

/** FMT-02. Mobile rows: `+$7.3M`, `+$719k`, and the full amount below that. */
export function formatMoneyCompact(value: number): string {
  return formatUsd(value, Math.abs(value) < COMPACT_ROW_FROM ? BOARD_CENTS : BOARD_SHORT);
}

/** FMT-04. Profile amounts: `+$323.2K`, `-$629`, `+$1.2M`. */
export function formatProfileMoney(value: number): string {
  return formatUsd(value, PROFILE);
}

/** FMT-04. Profile page titles use two decimals for millions: `+$1.10M`, `+$922.2K`. */
export function formatProfileTitleMoney(value: number): string {
  return formatUsd(value, PROFILE_TITLE);
}

/**
 * Whole dollars with the sign first, as the profile calendar writes them:
 * `+$161,061`, `-$10,863`. (The boards write losses as `$-21,622.00`.)
 */
export function formatSignedWhole(value: number): string {
  return formatUsd(value, CALENDAR_DAY);
}

/** Month and year totals in the calendar's Monthly view: `+$92.80K`, `-$4.34K`. */
export function formatMonthTotal(value: number): string {
  return formatUsd(value, CALENDAR_MONTH);
}

/** Chart axis labels and tooltips: `+$338K`, `-$12K`, `+$1.2M`. */
export function formatChartMoney(value: number): string {
  return formatUsd(value, SHORT_WHOLE_K);
}

const CHART_TICK_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const CHART_TOOLTIP_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Chart time axis: `Sep 25`. */
export function formatChartTick(t: number): string {
  return CHART_TICK_DATE.format(new Date(t));
}

/** Chart tooltip: `May 21, 2026`. */
export function formatChartDate(t: number): string {
  return CHART_TOOLTIP_DATE.format(new Date(t));
}

/**
 * Head-to-head chart labels, as seen: `+$154.0K`, `$-96.0K`, `+$723.6K`, the
 * dollar sign before the minus as on the boards. Millions (`+$1.2M`) were not
 * seen there; that unit is an assumption (docs/EVALS.md).
 */
export function formatBattleMoney(value: number): string {
  return formatUsd(value, BATTLE);
}

const DAY_TICK_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Head-to-head chart dates, as seen: `Sep 27`, in UTC. */
export function formatDayTick(t: number): string {
  return DAY_TICK_DATE.format(new Date(t));
}

/** Whole number with thousands separators: `3,000`. */
export function formatCount(value: number): string {
  return COUNT_FORMAT.format(value);
}

/** Max drawdown with one decimal, as on the source: `8.6%`, `100.0%`. */
export function formatDrawdown(fraction: number | null): string {
  return fraction === null ? MISSING : `${(fraction * 100).toFixed(1)}%`;
}

/** FMT-03. Day-mover amounts: `+$52K`, `-$12K`, `+$699`. */
export function formatMoverAmount(value: number): string {
  return formatUsd(value, SHORT_WHOLE_K);
}

/** FMT-06. Whole days between joining and the data timestamp: `755d`. */
export function formatDaysSince(joinedAt: string | null, asOf: string): string {
  if (!joinedAt) return MISSING;
  const days = Math.floor((Date.parse(asOf) - Date.parse(joinedAt)) / MS_PER_DAY);
  return days >= 0 ? `${days}d` : MISSING;
}

/** FMT-07. A bare wallet address is shortened: `0xcf19…6402`. */
export function formatTraderName(name: string): string {
  if (!WALLET_PATTERN.test(name)) return name;
  return `${name.slice(0, WALLET_HEAD_LENGTH)}…${name.slice(-WALLET_TAIL_LENGTH)}`;
}

/** FMT-08. `14 Nov, 1:07` in the given time zone (the viewer's when omitted). */
export function formatStamp(iso: string, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { ...STAMP_PARTS, timeZone }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("day")} ${part("month")}, ${Number(part("hour"))}:${part("minute")}`;
}

/** FMT-09. Score with at most one decimal: `50.3`, `81`. */
export function formatScore(score: number | null): string {
  return score === null ? MISSING : String(Math.round(score * 10) / 10);
}

/** FMT-09. Win rate as a whole percent: `47%`. */
export function formatWinRate(winRate: number | null): string {
  return winRate === null ? MISSING : `${Math.round(winRate * 100)}%`;
}

/** FMT-09. Sharpe with two decimals: `0.11`. */
export function formatSharpe(sharpe: number | null): string {
  return sharpe === null ? MISSING : sharpe.toFixed(2);
}

/** Return on stake as a percent with one decimal. Format assumed: no value was seen. */
export function formatRoi(roi: number | null): string {
  return roi === null ? MISSING : `${(roi * 100).toFixed(1)}%`;
}

/** Up to two initials for the avatar fallback. */
export function initialsOf(name: string): string {
  const cleaned = name
    .replace(/^0x/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  // Array.from splits by character, not by UTF-16 unit, so a letter outside
  // the basic plane is never cut in half.
  const words = cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => Array.from(word));
  const [first = [], second] = words;
  const letters = second ? [first[0], second[0]] : first.slice(0, 2);
  return letters.join("").toUpperCase() || "?";
}
