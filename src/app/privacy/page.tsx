import type { Metadata } from "next";

import { TopBarShell } from "@/features/shell/top-bar-shell";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    heading: "What we collect",
    body: "Nothing. There are no accounts, no forms that send anything, no analytics and no advertising. The site sets no cookies.",
  },
  {
    heading: "What your browser stores",
    body: 'If you switch between the dark and light theme, your choice is kept in your own browser\'s local storage under the name "theme". It never leaves your device. Clearing site data removes it.',
  },
  {
    heading: "Pictures from other sites",
    body: "Trader pictures load straight from the addresses the data source gives: X, Polymarket's image hosts, or the data source's own site. Your browser asks those hosts for the image, which tells them your IP address; it sends no information about this site with the request. All trader figures, by contrast, are fetched by our server, never by your browser.",
  },
  {
    heading: "Hosting",
    body: "The site runs on Vercel, which keeps standard request logs as any web host does.",
  },
  {
    heading: "Traders shown here",
    body: "Only figures that the data source already publishes are shown. Nothing on this site links a wallet to a real-world person.",
  },
];

/** Privacy page (D-015): the site collects nothing; pictures load from other hosts (D-033). */
export default function PrivacyPage() {
  return (
    <TopBarShell width="narrow">
      <h1 className="mb-8 text-2xl font-bold">Privacy</h1>
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
