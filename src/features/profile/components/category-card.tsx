import { formatCount, formatProfileMoney } from "@/features/leaderboard/format";
import { cn } from "@/lib/utils";

import type { CategoryRow } from "../history-data";
import { signedTextClass } from "./tone-styles";

/** Smallest visible bar, so a tiny category still shows a sliver (seen: 2%). */
const MIN_BAR_PERCENT = 2;
const FULL_BAR_PERCENT = 100;

/**
 * PROF-05: a Kalshi trader's all-time profit by category, with the number of
 * markets traded and a bar scaled to the largest category.
 */
export function CategoryCard({ rows }: { rows: readonly CategoryRow[] }) {
  const largest = Math.max(...rows.map((row) => Math.abs(row.pnl)), 1);

  return (
    <section
      aria-labelledby="categories-heading"
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="categories-heading" className="text-sm text-muted-foreground">
          P&amp;L by category
        </h2>
        <p className="text-xs text-muted-foreground">Kalshi · all-time · markets traded</p>
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const share = Math.max(
            MIN_BAR_PERCENT,
            Math.round((Math.abs(row.pnl) / largest) * FULL_BAR_PERCENT),
          );
          return (
            // Rows are 17.5 px high on the source: 14 px text at a 1.25 line height.
            // Fixed, because the smaller market count on the same line makes some
            // Chromium versions round the line up to 18 px (BUG-062).
            <li key={row.category} className="flex h-[17.5px] items-center gap-3 text-sm leading-tight">
              <div className="w-1/4 truncate">
                {row.category}
                <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                  {formatCount(row.markets)}
                </span>
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", row.pnl < 0 ? "bg-negative" : "bg-positive")}
                  style={{ width: `${share}%` }}
                />
              </div>
              <div className={cn("w-24 text-right tabular-nums", signedTextClass(row.pnl))}>
                {formatProfileMoney(row.pnl)}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
