import type { Metadata, Viewport } from "next";

import {
  BRAND_MARK_PATH,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
} from "@/features/shell/brand";
import { DARK_CLASS, THEME_INIT_SCRIPT } from "@/features/shell/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: PRODUCT_NAME, template: `%s | ${PRODUCT_NAME}` },
  description: PRODUCT_DESCRIPTION,
  icons: { icon: BRAND_MARK_PATH },
  // A look-alike demo has no business competing with the original in search.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The theme script may remove the dark class before React hydrates.
    <html lang="en" className={`${DARK_CLASS} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/*
          A plain inline script in <head> runs while the HTML is parsed, before
          the body exists, so a saved light theme never flashes dark.
          next/script's beforeInteractive was tried and rejected: in the
          production HTML it sits at the end of <body> and runs only after the
          app's own scripts load (docs/DECISIONS.md, D-028).
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
