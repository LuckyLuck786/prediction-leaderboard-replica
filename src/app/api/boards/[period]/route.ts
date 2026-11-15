import { getBoard } from "@/features/leaderboard/data";
import { LEADERBOARD_PERIODS } from "@/features/leaderboard/model";
import { isOneOf, unknownPeriod } from "@/lib/api-route";

// Must be a literal for Next.js to read it. Equal to
// UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

// The four periods are built ahead of time. Any other path reaches GET, which
// answers with a JSON 404 (BUG-085),
// which Next.js caches like any other path (accepted, D-064).

export function generateStaticParams() {
  return LEADERBOARD_PERIODS.map((period) => ({ period }));
}

/** One period of the home board as JSON: live, or the labelled snapshot (D-029). */
export async function GET(_request: Request, { params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isOneOf(LEADERBOARD_PERIODS, period)) return unknownPeriod(LEADERBOARD_PERIODS);
  return Response.json(await getBoard(period));
}
