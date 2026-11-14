import Link from "next/link";

import { DATA_CREDIT, DISCLAIMER } from "./brand";

const FOOTER_LINKS = [
  { label: "Polymarket board", href: "/polymarket" },
  { label: "Kalshi board", href: "/kalshi" },
  { label: "Get listed", href: "/submit" },
  { label: "API", href: "/api-docs" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
      <nav
        aria-label="Site"
        className="flex flex-wrap items-center justify-center gap-x-12 gap-y-2"
      >
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mx-auto mt-6 max-w-xl text-center text-xs">{DISCLAIMER}</p>
      <p className="mt-2 text-center text-xs">
        <a
          href={DATA_CREDIT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          {DATA_CREDIT.label}
        </a>
      </p>
    </footer>
  );
}
