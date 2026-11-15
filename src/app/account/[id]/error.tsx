"use client";

import { ErrorNotice } from "@/features/shell/error-notice";
import { TopBarShell } from "@/features/shell/top-bar-shell";

/**
 * Shown when a profile cannot be loaded for any reason other than "no such
 * trader". Rendered by the error boundary, so the failure is never cached.
 */
export default function ProfileError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <TopBarShell width="wide">
      <ErrorNotice
        error={error}
        logMessage="Profile page failed."
        title="This profile is unavailable right now"
        detail="The data source did not answer. Try again in a moment."
        retry={retry}
      />
    </TopBarShell>
  );
}
