import { getKalshiBoard } from "@/features/kalshi/data";
import { KALSHI_PERIODS, type KalshiPeriod } from "@/features/kalshi/model";

// Equal to UPSTREAM_REVALIDATE_SECONDS; a test keeps the two in step.
export const revalidate = 300;

// Only the four periods exist; anything else is a 404 without running GET.
export const dynamicParams = false;

export function generateStaticParams() {
  return KALSHI_PERIODS.map((period) => ({ period }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  return Response.json(await getKalshiBoard(period as KalshiPeriod));
}
