import Link from "next/link";

import { DATA_CREDIT, DISCLAIMER } from "@/features/shell/brand";

/**
 * In the slot of the source's host link: a way back, the disclaimer and the
 * data credit, which every page carries (DEV-26).
 */
export function BattleFooter() {
  return (
    <footer className="mt-8 text-center text-xs text-muted-foreground">
      <Link href="/" className="text-sm underline hover:text-foreground">
        Back to the leaderboard
      </Link>
      <p className="mx-auto mt-4 max-w-xl">{DISCLAIMER}</p>
      <p className="mt-2">
        <a
          href={DATA_CREDIT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          {DATA_CREDIT.label}
        </a>
      </p>
    </footer>
  );
}
