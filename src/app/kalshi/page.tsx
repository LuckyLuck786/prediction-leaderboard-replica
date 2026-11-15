import type { Metadata } from "next";

import { KalshiView } from "@/features/kalshi/components/kalshi-view";
import { getKalshiBoard } from "@/features/kalshi/data";
import { DEFAULT_KALSHI_PERIOD } from "@/features/kalshi/model";
import { AboutSection, type AboutQuestion } from "@/features/shell/about-section";
import { LeaderboardShell } from "@/features/shell/leaderboard-shell";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Kalshi traders by profit",
  description: "The 1,000 most profitable Kalshi traders, by day, week, month and all time.",
};

const QUESTIONS: readonly AboutQuestion[] = [
  {
    question: "What does this page show?",
    answer:
      "Kalshi's most profitable traders, a thousand of them, ranked by profit for the period you pick.",
  },
  {
    question: "Do I need a Kalshi account to see it?",
    answer: "No. It is built from public profiles and needs no sign-in.",
  },
  {
    question: "How are day, week and month figures measured?",
    answer:
      "As the change in a trader's all-time profit between snapshots taken about two hours apart. That includes moves on positions still open, so it can differ from Kalshi's own daily figure.",
  },
  {
    question: "Can I see a trader's history?",
    answer:
      "Traders the data source follows closely have a profile page here; their names link to it. Other names link to their public Kalshi page.",
  },
  {
    question: "Why is someone missing?",
    answer:
      "Traders who hide their Kalshi stats or have deleted their profile are left out, as on Kalshi's own leaderboard.",
  },
];

const LINKS = [
  { label: "all platforms", href: "/" },
  { label: "Polymarket board", href: "/polymarket" },
  { label: "get listed", href: "/submit" },
  { label: "API", href: "/api-docs" },
] as const;

/** R-03 Kalshi board (spec 4.3): the default period renders here; the others load when picked (D-034). */
export default async function KalshiPage() {
  const initial = await getKalshiBoard(DEFAULT_KALSHI_PERIOD);

  return (
    <LeaderboardShell>
      <KalshiView initial={initial} />
      <AboutSection
        heading="About this board"
        intro="A ranking of the most profitable Kalshi traders over the last day, week, month or all time, refreshed every few minutes from the data source."
        questions={QUESTIONS}
        links={LINKS}
      />
    </LeaderboardShell>
  );
}
