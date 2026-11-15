import type { Metadata, Viewport } from "next";

import {
  BRAND_MARK_PATH,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
} from "@/features/shell/brand";
import { DARK_CLASS } from "@/features/shell/theme";
import { ThemeScript } from "@/features/shell/theme-script";

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

/** Root layout: dark by default; a saved light theme is applied before the first paint (D-028). */
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
          An inline script in <head> runs while the HTML is parsed, before the
          body exists, so a saved light theme never flashes dark (D-028).
        */}
        <ThemeScript />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
