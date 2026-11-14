import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { loadSnapshot } from "@/features/leaderboard/snapshot";
import { PRODUCT_NAME } from "@/features/shell/brand";
import { SiteFooter } from "@/features/shell/site-footer";

export default function HomePage() {
  const snapshot = loadSnapshot();

  return (
    <div className="min-h-screen overflow-x-hidden p-3 sm:p-5">
      <main className="mx-auto max-w-4xl">
        <LeaderboardView
          heading={PRODUCT_NAME}
          description="Who is ahead on Polymarket, Kalshi and Hyperliquid, ranked by profit and loss."
          boards={snapshot.boards}
          dailyProfit={snapshot.dailyProfit}
          snapshotCapturedAt={snapshot.capturedAt}
        />
        <SiteFooter />
      </main>
    </div>
  );
}
