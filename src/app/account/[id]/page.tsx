import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatProfileTitleMoney, formatTraderName } from "@/features/leaderboard/format";
import { ProfileView } from "@/features/profile/components/profile-view";
import { ProfileUnavailableError, getProfile } from "@/features/profile/data";
import { getProfileExtras } from "@/features/profile/history-data";
import { TopBarShell } from "@/features/shell/top-bar-shell";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

// No profile is built ahead of time; each is rendered on its first visit and
// then cached for the revalidate period.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getProfile(id);
  if (result.kind !== "found") return { title: "Trader" };
  const allTime = result.profile.pnl.all;
  const name = formatTraderName(result.profile.name);
  return {
    title: allTime === null ? name : `${name} · ${formatProfileTitleMoney(allTime)} all-time`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const result = await getProfile(id);
  if (result.kind === "not-found") notFound();
  // Thrown, not rendered: a rendered "unavailable" page would be cached for
  // the whole revalidate period. error.tsx shows the message instead.
  if (result.kind === "unavailable") throw new ProfileUnavailableError(id);

  const extras = await getProfileExtras(result.profile);

  return (
    <TopBarShell width="wide">
      <ProfileView
        profile={result.profile}
        history={extras.history}
        categories={extras.categories}
        today={extras.today}
      />
    </TopBarShell>
  );
}
