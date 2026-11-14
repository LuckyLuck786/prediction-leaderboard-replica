// Our own branding and the lines every page must carry. The upstream name
// lives in src/upstream/source.json and nowhere else in application code.

import source from "@/upstream/source.json";

export const PRODUCT_NAME = "Luqky's Prediction Leaderboard";
export const PRODUCT_TAG = "demo";
export const PRODUCT_DESCRIPTION =
  "An independent demo that ranks prediction-market traders by profit and loss.";

export const BRAND_MARK_PATH = "/brand/mark.svg";

/** Shown in the footer of every page and in the README, word for word. */
export const DISCLAIMER = `Independent demo built for a hiring assignment. Not affiliated with ${source.name}, Polymarket or Kalshi.`;

/** The upstream API asks for credit and a link back wherever its data is shown. */
export const DATA_CREDIT = {
  label: `Data: ${source.name} public API`,
  href: source.origin,
} as const;
