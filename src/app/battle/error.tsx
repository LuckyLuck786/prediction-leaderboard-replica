"use client";

import { BareShell } from "@/features/battle/components/bare-shell";
import { BattleFooter } from "@/features/battle/components/battle-footer";
import { ErrorNotice } from "@/features/shell/error-notice";

/**
 * Shown only when no complete head-to-head page has been built yet and the
 * data is incomplete. Otherwise Next.js keeps serving the last complete page.
 */
export default function BattleError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <BareShell>
      <ErrorNotice
        error={error}
        logMessage="Head-to-head page failed."
        title="The head to head is unavailable right now"
        detail="The data source did not answer. Try again in a moment."
        retry={retry}
      />
      <BattleFooter />
    </BareShell>
  );
}
