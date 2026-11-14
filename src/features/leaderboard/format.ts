// Display formats for the leaderboard. Each rule mirrors a format observed on
// the source site; the IDs refer to docs/SPEC.md, section 3.3.

/** Shown wherever a value is missing. */
export const MISSING = "–";

const MS_PER_DAY = 86_400_000;
const THOUSAND = 1_000;
const MILLION = 1_000_000;
/** Smallest amount that rounds to "1K" rather than "999". */
const ROUNDS_TO_THOUSAND = 999.5;
/** Smallest amount that rounds to "1.0M" rather than "1000K". */
const ROUNDS_TO_MILLION = 999_500;
/**
 * Mobile rows shorten amounts from here up. Observed: 57.6K stayed full and
 * 349.8K was short, so the real switch lies between the two. Assumed.
 */
const COMPACT_ROW_FROM = 100_000;
const WALLET_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const WALLET_HEAD_LENGTH = 6;
const WALLET_TAIL_LENGTH = 4;

const DOLLARS_AND_CENTS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const WHOLE_DOLLARS = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const STAMP_PARTS = {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
} as const;

const millions = (amount: number) => `${(amount / MILLION).toFixed(1)}M`;

/**
 * FMT-01. `+$57,643.38`; negatives keep the source's order: `$-21,622.00`.
 * An amount that rounds to zero is shown as `+$0.00`.
 */
export function formatMoney(value: number): string {
  const cents = Math.round(value * 100);
  const digits = DOLLARS_AND_CENTS.format(Math.abs(cents) / 100);
  return cents < 0 ? `$-${digits}` : `+$${digits}`;
}

/** FMT-05. Whole dollars: `+$7,943,912`. Negatives follow FMT-01. */
export function formatMoneyWhole(value: number): string {
  const dollars = Math.round(value);
  const digits = WHOLE_DOLLARS.format(Math.abs(dollars));
  return dollars < 0 ? `$-${digits}` : `+$${digits}`;
}

/** FMT-02. Mobile rows: `+$7.3M`, `+$719k`, and the full amount below that. */
export function formatMoneyCompact(value: number): string {
  const amount = Math.abs(value);
  if (amount < COMPACT_ROW_FROM) return formatMoney(value);
  const short =
    amount >= ROUNDS_TO_MILLION
      ? millions(amount)
      : `${Math.round(amount / THOUSAND)}k`;
  return value < 0 ? `$-${short}` : `+$${short}`;
}

/** FMT-03. Day-mover amounts: `+$52K`, `-$12K`, `+$699`. */
export function formatMoverAmount(value: number): string {
  const amount = Math.abs(value);
  let short: string;
  if (amount >= ROUNDS_TO_MILLION) short = millions(amount);
  else if (amount >= ROUNDS_TO_THOUSAND) short = `${Math.round(amount / THOUSAND)}K`;
  else short = String(Math.round(amount));
  // A loss that rounds to nothing is shown as "+$0", never "-$0".
  const isLoss = value < 0 && short !== "0";
  return `${isLoss ? "-" : "+"}$${short}`;
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
  const parts = new Intl.DateTimeFormat("en-US", { ...STAMP_PARTS, timeZone })
    .formatToParts(new Date(iso));
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
  const cleaned = name.replace(/^0x/i, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  // Array.from splits by character, not by UTF-16 unit, so a letter outside
  // the basic plane is never cut in half.
  const words = cleaned.split(" ").filter(Boolean).map((word) => Array.from(word));
  const letters =
    words.length > 1 ? [words[0][0], words[1][0]] : (words[0] ?? []).slice(0, 2);
  return letters.join("").toUpperCase() || "?";
}
