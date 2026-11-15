"use client";

import { ErrorNotice } from "@/features/shell/error-notice";
import { TopBarShell } from "@/features/shell/top-bar-shell";

/**
 * Any page error without a more specific error page. Keeps the shell, and so
 * the disclaimer, on screen (CLAUDE.md rule 6). Profiles and the head-to-head
 * page have their own error pages.
 */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <TopBarShell width="narrow">
      <ErrorNotice
        error={error}
        logMessage="Page failed."
        title="Something went wrong on this page"
        detail="Try again in a moment."
        retry={retry}
      />
    </TopBarShell>
  );
}
