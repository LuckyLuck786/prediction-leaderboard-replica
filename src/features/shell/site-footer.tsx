import Link from "next/link";

import { DATA_CREDIT, DISCLAIMER } from "./brand";

/**
 * Footer navigation. A link is added here in the same commit that adds its
 * page: a test fails for any link without a route behind it.
 */
export const FOOTER_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Polymarket board", href: "/polymarket" },
  { label: "Kalshi board", href: "/kalshi" },
  { label: "Head to head", href: "/battle" },
  { label: "Get listed", href: "/submit" },
  { label: "API", href: "/api-docs" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

/** The footer of every page but the head-to-head one, which has its own: links, the disclaimer and the data credit. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
      {FOOTER_LINKS.length > 0 ? (
        <nav aria-label="Site" className="mb-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <p className="mx-auto max-w-xl text-center text-xs">{DISCLAIMER}</p>
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
