"use client";

import { useEffect } from "react";

import { TopBarShell } from "@/features/shell/top-bar-shell";

/**
 * Shown when a profile cannot be loaded for any reason other than "no such
 * trader". Rendered by the error boundary, so the failure is never cached.
 */
export default function ProfileError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Profile page failed.", error);
  }, [error]);

  return (
    <TopBarShell width="wide">
      <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
        <h1 className="mb-2 text-xl text-foreground">This profile is unavailable right now</h1>
        <p>The data source did not answer. Try again in a moment.</p>
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
