import { cn } from "@/lib/utils";

import type { FilterablePlatform } from "../model";

// Our own letter marks. The platforms' logos are their trademarks and are not
// used here.
const BADGES: Record<FilterablePlatform, { letter: string; className: string }> = {
  polymarket: { letter: "P", className: "bg-polymarket" },
  kalshi: { letter: "K", className: "bg-kalshi" },
  hyperliquid: { letter: "H", className: "bg-hyperliquid" },
};

const BADGE_BOX =
  "flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-semibold text-background sm:h-6 sm:w-6 sm:text-xs";

/** Our letter mark for a platform (D-018). Hidden from assistive technology: the element around it must give the name. */
export function PlatformBadge({ platform }: { platform: FilterablePlatform }) {
  const badge = BADGES[platform];
  return (
    <span aria-hidden className={cn(BADGE_BOX, "rounded-full", badge.className)}>
      {badge.letter}
    </span>
  );
}

/** Our letter mark for X. Hidden from assistive technology: the element around it must give the name. */
export function XBadge() {
  return (
    <span aria-hidden className={cn(BADGE_BOX, "bg-foreground")}>
      X
    </span>
  );
}
