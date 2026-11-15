"use client";

import { useEffect } from "react";

import { TopBarShell } from "@/features/shell/top-bar-shell";

/**
 * Any page error without a more specific error page. Keeps the shell, and so
 * the disclaimer, on screen (CLAUDE.md rule 6). Profiles and the head-to-head
 * page have their own error pages.
 */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Page failed.", error);
  }, [error]);

  return (
    <TopBarShell width="narrow">
      <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
        <h1 className="mb-2 text-xl text-foreground">Something went wrong on this page</h1>
        <p>Try again in a moment.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 border border-border px-3 py-1 text-foreground hover:bg-accent"
        >
          Try again
        </button>
      </div>
    </TopBarShell>
  );
}
