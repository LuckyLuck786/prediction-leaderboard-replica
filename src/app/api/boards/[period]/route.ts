import { getBoard } from "@/features/leaderboard/data";
import { LEADERBOARD_PERIODS, type LeaderboardPeriod } from "@/features/leaderboard/model";

// Must be a literal for Next.js to read it. Equal to
// UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;

// Only the four periods exist; anything else is a 404 without running GET.
export const dynamicParams = false;

export function generateStaticParams() {
  return LEADERBOARD_PERIODS.map((period) => ({ period }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  return Response.json(await getBoard(period as LeaderboardPeriod));
}
