// Shades for day cells and bars (PROF-03). Written out in full so Tailwind
// sees every class. The source uses one colour at rising opacity per level
// and a darker colour for the top level; ours does the same with our tokens.

import type { DayTone } from "../history";

export const CELL_BACKGROUND: Record<DayTone, string> = {
  none: "",
  flat: "",
  // Lighter in the dark theme: the day's text sits on these, and above about
  // half strength light text no longer reaches 4.5:1 (BUG-064). The opacity
  // values are read by src/app/contrast.test.ts.
  best: "bg-brand/60 dark:bg-brand/50",
  "gain-1": "bg-positive/20 dark:bg-positive/20",
  "gain-2": "bg-positive/30 dark:bg-positive/28",
  "gain-3": "bg-positive/40 dark:bg-positive/36",
  "gain-4": "bg-positive/50 dark:bg-positive/44",
  "gain-5": "bg-positive/65 dark:bg-positive/52",
  "loss-1": "bg-negative/20 dark:bg-negative/20",
  "loss-2": "bg-negative/30 dark:bg-negative/28",
  "loss-3": "bg-negative/40 dark:bg-negative/36",
  "loss-4": "bg-negative/50 dark:bg-negative/44",
  "loss-5": "bg-negative/65 dark:bg-negative/52",
};

/** The strip's small bars also show flat and missing days. */
export const BAR_BACKGROUND: Record<DayTone, string> = {
  ...CELL_BACKGROUND,
  none: "bg-muted/30",
  flat: "bg-muted",
};

/**
 * Text on a day cell. A shaded cell shows its colour in the background, so
 * its text uses the plain text colour: the shade's own colour on its own tint
 * is unreadable (BUG-064). An unshaded cell is muted.
 */
export function cellTextClass(tone: DayTone): string {
  return CELL_BACKGROUND[tone] === "" ? "text-muted-foreground" : "text-foreground";
}

/** Colour for a signed total. */
export function signedTextClass(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}
