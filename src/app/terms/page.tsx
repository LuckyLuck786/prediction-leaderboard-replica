import type { Metadata } from "next";

import { DATA_CREDIT, DISCLAIMER, PRODUCT_NAME } from "@/features/shell/brand";
import { TopBarShell } from "@/features/shell/top-bar-shell";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS = [
  {
    heading: "What this site is",
    body: `${PRODUCT_NAME} is a demo built to show how a product can be rebuilt and verified with AI coding tools. It is not a service, it has no accounts, and it may change or go offline at any time.`,
  },
  {
    heading: "Not financial advice",
    body: "Nothing here is a recommendation to trade, invest or bet. Past profit says nothing about future results. Prediction markets can lose you all of your stake.",
  },
  {
    heading: "Where the data comes from",
    body: `All trader figures come from a public, keyless API (${DATA_CREDIT.href}) and are shown as received, cached for a few minutes. They may be late, incomplete or wrong. When that API is unavailable the site shows a saved snapshot and says so.`,
  },
  {
    heading: "No warranty",
    body: "The site is provided as is, without warranty of any kind. Use it at your own risk.",
  },
  {
    heading: "Trademarks",
    body: "Polymarket, Kalshi, Hyperliquid and X are trademarks of their owners and are named only to describe where the data comes from. Their logos are not used.",
  },
];

export default function TermsPage() {
  return (
    <TopBarShell width="narrow">
      <h1 className="mb-1 text-2xl font-bold">Terms</h1>
      <p className="mb-8 text-sm text-muted-foreground">{DISCLAIMER}</p>
      <div className="space-y-6 text-sm leading-6">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-1 font-medium">{section.heading}</h2>
            <p className="text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </TopBarShell>
  );
}
