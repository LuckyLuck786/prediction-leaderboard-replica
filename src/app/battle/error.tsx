"use client";

import { useEffect } from "react";

import { BareShell } from "@/features/battle/components/bare-shell";
import { BattleFooter } from "@/features/battle/components/battle-footer";

/**
 * Shown only when no complete head-to-head page has been built yet and the
 * data is incomplete. Otherwise Next.js keeps serving the last complete page.
 */
export default function BattleError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Head-to-head page failed.", error);
  }, [error]);

  return (
    <BareShell>
      <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
        <h1 className="mb-2 text-xl text-foreground">The head to head is unavailable right now</h1>
        <p>The data source did not answer. Try again in a moment.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 border border-border px-3 py-1 text-foreground hover:bg-accent"
        >
          Try again
        </button>
      </div>
      <BattleFooter />
    </BareShell>
  );
}
