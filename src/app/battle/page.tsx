import type { Metadata } from "next";

import { BareShell } from "@/features/battle/components/bare-shell";
import { BattleView } from "@/features/battle/components/battle-view";
import { getBattle } from "@/features/battle/data";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Head to head" };

/** R-05, SHELL-03: no header or footer bar, one centered 768 px column. */
export default async function BattlePage() {
  const battle = await getBattle();
  return (
    <BareShell>
      <BattleView battle={battle} />
    </BareShell>
  );
}
