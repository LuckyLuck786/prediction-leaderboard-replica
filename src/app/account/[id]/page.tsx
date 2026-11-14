import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatProfileMoney, formatTraderName } from "@/features/leaderboard/format";
import { ProfileView } from "@/features/profile/components/profile-view";
import { getProfile } from "@/features/profile/data";
import { TopBarShell } from "@/features/shell/top-bar-shell";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;

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
    title: allTime === null ? name : `${name} · ${formatProfileMoney(allTime)} all-time`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const result = await getProfile(id);
  if (result.kind === "not-found") notFound();

  return (
    <TopBarShell width="wide">
      {result.kind === "found" ? (
        <ProfileView profile={result.profile} />
      ) : (
        <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
          <h1 className="mb-2 text-xl text-foreground">This profile is unavailable right now</h1>
          <p>The data source did not answer. Try again in a few minutes.</p>
        </div>
      )}
    </TopBarShell>
  );
}
