import type { Metadata } from "next";

import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import { getBoard, getDailyProfit } from "@/features/leaderboard/data";
import { DEFAULT_PERIOD } from "@/features/leaderboard/model";
import { AboutSection, type AboutQuestion } from "@/features/shell/about-section";
import { LeaderboardShell } from "@/features/shell/leaderboard-shell";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Polymarket traders by profit",
  description: "Polymarket traders ranked by profit and loss for the day, month, year and all time.",
};

const QUESTIONS: readonly AboutQuestion[] = [
  {
    question: "What does this page show?",
    answer:
      "The Polymarket traders tracked by the data source, ranked by how much they gained or lost over the period you pick. Traders who also trade elsewhere appear here too.",
  },
  {
    question: "Where do the numbers come from?",
    answer:
      "From the public profit and loss figures Polymarket keeps for each wallet. When one person uses several wallets, the data source adds them up into one row.",
  },
  {
    question: "How is this different from Polymarket's own ranking?",
    answer:
      "Polymarket ranks wallets. This page ranks people, with their wallets combined, and adds a consistency score, win rate and return on stake.",
  },
  {
    question: "Can I add an account?",
    answer:
      "Not here. This is a demo and collects nothing. The get-listed page shows what the form looks like, with sending switched off.",
  },
  {
    question: "Is the data available as an API?",
    answer:
      "Yes. The API page lists the endpoints this demo serves and links to the public source it reads from.",
  },
];

const LINKS = [
  { label: "all platforms", href: "/" },
  { label: "Kalshi board", href: "/kalshi" },
  { label: "get listed", href: "/submit" },
  { label: "API", href: "/api-docs" },
] as const;

export default async function PolymarketPage() {
  const [initial, dailyProfit] = await Promise.all([getBoard(DEFAULT_PERIOD), getDailyProfit()]);

  return (
    <LeaderboardShell>
      <LeaderboardView
        heading="Polymarket traders"
        description="The Polymarket traders we follow, ranked by profit and loss."
        initial={initial}
        dailyProfit={dailyProfit}
        initialPlatform="polymarket"
      />
      <AboutSection
        heading="About this board"
        intro="A ranking of Polymarket traders by profit and loss over the last day, month, year or all time, refreshed every few minutes from the data source."
        questions={QUESTIONS}
        links={LINKS}
      />
    </LeaderboardShell>
  );
}
