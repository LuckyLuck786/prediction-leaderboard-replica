import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SiteFooter } from "./site-footer";
import { ThemeToggle } from "./theme-toggle";

const COLUMN_WIDTHS = {
  /** Trader profile. */
  wide: "max-w-4xl",
  /** API reference. */
  medium: "max-w-3xl",
  /** Forms and plain text pages. */
  narrow: "max-w-xl",
} as const;

/**
 * SHELL-02: a bar with a back link and the theme toggle, then one column.
 * The footer keeps the disclaimer on every page.
 */
export function TopBarShell({
  width,
  backLabel = "Leaderboard",
  children,
}: {
  width: keyof typeof COLUMN_WIDTHS;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b border-border">
        <div className={cn("mx-auto flex items-center justify-between p-4", COLUMN_WIDTHS[width])}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-accent"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
            {backLabel}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-8", COLUMN_WIDTHS[width])}>
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
