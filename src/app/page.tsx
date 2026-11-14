import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { getBoard, getDailyProfit } from "@/features/leaderboard/data";
import { DEFAULT_PERIOD } from "@/features/leaderboard/model";
import { PRODUCT_NAME } from "@/features/shell/brand";
import { LeaderboardShell } from "@/features/shell/leaderboard-shell";

// Regenerated at most every 5 minutes: equal to UPSTREAM_REVALIDATE_SECONDS,
// kept in step by a test. Must be a literal for Next.js to read it.
export const revalidate = 300;

export default async function HomePage() {
  const [initial, dailyProfit] = await Promise.all([getBoard(DEFAULT_PERIOD), getDailyProfit()]);

  return (
    <LeaderboardShell>
      <LeaderboardView
        heading={PRODUCT_NAME}
        description="Who is ahead on Polymarket, Kalshi and Hyperliquid, ranked by profit and loss."
        initial={initial}
        dailyProfit={dailyProfit}
      />
    </LeaderboardShell>
  );
}
