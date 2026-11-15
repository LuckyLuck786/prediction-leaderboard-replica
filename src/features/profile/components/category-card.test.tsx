// @vitest-environment jsdom
// PROF-05: profit by category, with markets traded and bars scaled to the largest.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { nth } from "@/lib/test-utils";

import { CategoryCard } from "./category-card";

afterEach(cleanup);

const rows = [
  { category: "Politics", pnl: 50_000, markets: 1_234 },
  { category: "Sports", pnl: -25_000, markets: 40 },
  { category: "Weather", pnl: 100, markets: 2 },
];

/** Each row's bar: the inner element whose width is set. */
const bars = () => screen.getAllByRole("listitem").map((row) => row.querySelector<HTMLElement>("[style]"));

describe("CategoryCard", () => {
  it("lists each category with its markets and profit, signed and coloured", () => {
    render(<CategoryCard rows={rows} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Politics1,234+$50.0K",
      "Sports40-$25.0K",
      "Weather2+$100",
    ]);
    expect(screen.getByText("-$25.0K").className).toContain("text-negative");
  });

  it("scales bars to the largest category, loss or gain, with a visible minimum", () => {
    render(<CategoryCard rows={rows} />);
    const [politics, sports, weather] = bars();
    expect(politics?.style.width).toBe("100%");
    expect(sports?.style.width).toBe("50%");
    expect(sports?.className).toContain("bg-negative");
    expect(weather?.style.width).toBe("2%");
  });

  it("scales by size when the largest category is a loss", () => {
    render(
      <CategoryCard
        rows={[
          { category: "Crypto", pnl: -80_000, markets: 9 },
          { category: "Economics", pnl: 20_000, markets: 3 },
        ]}
      />,
    );
    expect(nth(bars(), 0)?.style.width).toBe("100%");
    expect(nth(bars(), 1)?.style.width).toBe("25%");
  });
});
