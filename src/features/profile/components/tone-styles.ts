// Shades for day cells and bars (PROF-03). Written out in full so Tailwind
// sees every class. The source uses one colour at rising opacity per level
// and a darker colour for the top level; ours does the same with our tokens.

import type { DayTone } from "../history";

export const CELL_BACKGROUND: Record<DayTone, string> = {
  none: "",
  flat: "",
  best: "bg-brand/60",
  "gain-1": "bg-positive/20",
  "gain-2": "bg-positive/30",
  "gain-3": "bg-positive/40",
  "gain-4": "bg-positive/50",
  "gain-5": "bg-positive/70",
  "loss-1": "bg-negative/20",
  "loss-2": "bg-negative/30",
  "loss-3": "bg-negative/40",
  "loss-4": "bg-negative/50",
  "loss-5": "bg-negative/70",
};

/** The strip's small bars also show flat and missing days. */
export const BAR_BACKGROUND: Record<DayTone, string> = {
  ...CELL_BACKGROUND,
  none: "bg-muted/30",
  flat: "bg-muted",
};

export function amountTextClass(tone: DayTone, change: number): string {
  if (tone === "best") return "text-brand";
  if (change > 0) return "text-positive";
  if (change < 0) return "text-negative";
  return "text-muted-foreground";
}

/** Colour for a signed total. */
export function signedTextClass(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}
