import { getKalshiBoard } from "@/features/kalshi/data";
import { KALSHI_PERIODS } from "@/features/kalshi/model";
import { isOneOf, unknownPeriod } from "@/lib/api-route";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

// The four periods are built ahead of time. Any other path reaches GET, which
// answers with a JSON 404 (BUG-085).

export function generateStaticParams() {
  return KALSHI_PERIODS.map((period) => ({ period }));
}

/** One period of the Kalshi board as JSON: live, or the labelled snapshot. */
export async function GET(_request: Request, { params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isOneOf(KALSHI_PERIODS, period)) return unknownPeriod(KALSHI_PERIODS);
  return Response.json(await getKalshiBoard(period));
}
