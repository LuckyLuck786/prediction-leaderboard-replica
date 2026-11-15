import { getKalshiBoard } from "@/features/kalshi/data";
import { KALSHI_PERIODS, type KalshiPeriod } from "@/features/kalshi/model";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;
// Upstream requests skip the fetch cache (cache: "no-store"); this keeps the
// route static anyway, refreshed on the schedule above (BUG-050, D-047).
export const dynamic = "force-static";

// Only the four periods exist; anything else is a 404 without running GET.
export const dynamicParams = false;

export function generateStaticParams() {
  return KALSHI_PERIODS.map((period) => ({ period }));
}

/** One period of the Kalshi board as JSON: live, or the labelled snapshot. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  return Response.json(await getKalshiBoard(period as KalshiPeriod));
}
