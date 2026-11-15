"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// The source draws no border on its chips, so sizes match only without one.
const CHIP_ON = "bg-primary text-primary-foreground";
const CHIP_OFF = "text-foreground hover:bg-accent";

/** A toggle in the board controls; aria-pressed says whether it is on. */
export function Chip({
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
