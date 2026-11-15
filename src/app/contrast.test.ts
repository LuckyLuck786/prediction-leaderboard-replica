// Colour contrast from the design tokens themselves (docs/EVALS.md,
// "Accessibility"). axe checks what a page shows at the moment it runs; this
// checks every token and every calendar shade in both themes, including
// states a page may not be showing, against WCAG 2.2 AA.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CELL_BACKGROUND } from "@/features/profile/components/tone-styles";

/**
 * WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for focus indicators and other UI
 * parts. Checked with a margin: a browser blends a tint to whole RGB values,
 * and axe measured 4.49:1 where this exact calculation gave 4.51:1.
 */
const ROUNDING_MARGIN = 0.1;
const TEXT_RATIO = 4.5 + ROUNDING_MARGIN;
const UI_RATIO = 3 + ROUNDING_MARGIN;
/** Platform badges use their colour at 10% behind text in that colour. */
const BADGE_TINT = 0.1;

type Rgb = [number, number, number];

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function tokens(block: string): Record<string, Rgb> {
  const found: Record<string, Rgb> = {};
  for (const [, name, hex] of block.matchAll(/--([a-z-]+):\s*#([0-9a-f]{6});/g)) {
    if (name && hex) found[name] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16)) as Rgb;
  }
  return found;
}

/** A token's colour; a token missing from globals.css fails the test that reads it. */
function tokenOf(theme: Record<string, Rgb>, name: string): Rgb {
  const colour = theme[name];
  if (!colour) throw new Error(`globals.css has no --${name} in this theme`);
  return colour;
}

const THEMES = {
  light: tokens(css.slice(css.indexOf(":root {"), css.indexOf(".dark {"))),
  dark: tokens(css.slice(css.indexOf(".dark {"), css.indexOf("@layer base"))),
};

function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [first, second] = [luminance(a), luminance(b)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function over(colour: Rgb, base: Rgb, alpha: number): Rgb {
  const mix = (top: number, bottom: number) => alpha * top + (1 - alpha) * bottom;
  return [mix(colour[0], base[0]), mix(colour[1], base[1]), mix(colour[2], base[2])];
}

const SURFACES = ["background", "card", "muted", "secondary"];
const TEXT_COLOURS = [
  "muted-foreground",
  "brand",
  "positive",
  "negative",
  "destructive",
  "score-risky",
  "score-weak",
  "score-fair",
  "score-good",
  "score-strong",
  "polymarket",
  "kalshi",
  "hyperliquid",
];

/** Calendar shades as Tailwind writes them: token and opacity, per theme. */
function cellShades(theme: "light" | "dark") {
  const pattern = theme === "light" ? /(?:^| )bg-([a-z-]+)\/(\d+)/ : /dark:bg-([a-z-]+)\/(\d+)/;
  return Object.entries(CELL_BACKGROUND).flatMap(([tone, classes]) => {
    const [, token, percent] = pattern.exec(classes) ?? [];
    return token && percent ? [{ tone, token, alpha: Number(percent) / 100 }] : [];
  });
}

describe.each(["light", "dark"] as const)("%s theme contrast (WCAG AA)", (theme) => {
  const colours = THEMES[theme];
  const colour = (name: string) => tokenOf(colours, name);

  it("reads every token it checks", () => {
    for (const name of [...SURFACES, ...TEXT_COLOURS, "foreground", "ring"]) {
      expect(() => colour(name), name).not.toThrow();
    }
  });

  it.each(TEXT_COLOURS)("%s text reads on every surface and on its own badge tint", (name) => {
    for (const surface of SURFACES) {
      expect(ratio(colour(name), colour(surface)), `${name} on ${surface}`).toBeGreaterThanOrEqual(
        TEXT_RATIO,
      );
    }
    const tint = over(colour(name), colour("background"), BADGE_TINT);
    expect(ratio(colour(name), tint), `${name} on its tint`).toBeGreaterThanOrEqual(TEXT_RATIO);
  });

  it("the focus ring stands out from the page and from cards", () => {
    for (const surface of ["background", "card"]) {
      expect(ratio(colour("ring"), colour(surface)), `ring on ${surface}`).toBeGreaterThanOrEqual(UI_RATIO);
    }
  });

  it("calendar text reads on every day shade (BUG-064)", () => {
    const shades = cellShades(theme);
    expect(shades.length).toBe(11);
    for (const { tone, token, alpha } of shades) {
      const cell = over(colour(token), colour("card"), alpha);
      expect(ratio(colour("foreground"), cell), tone).toBeGreaterThanOrEqual(TEXT_RATIO);
    }
  });
});

/**
 * Neighbouring score bands must be told apart by colour. Darkening the light
 * theme's "good" for contrast once brought it to 1.11:1 against "strong"; the
 * themes were designed at 1.44 (light) and 1.39 (dark).
 */
const MIN_BAND_STEP = 1.3;

describe("score bands stay apart", () => {
  it.each(["light", "dark"] as const)("%s: good and strong differ clearly", (theme) => {
    const colours = THEMES[theme];
    expect(ratio(tokenOf(colours, "score-good"), tokenOf(colours, "score-strong"))).toBeGreaterThanOrEqual(
      MIN_BAND_STEP,
    );
  });
});
