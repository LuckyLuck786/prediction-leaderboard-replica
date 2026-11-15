// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TraderAvatar } from "./trader-avatar";

afterEach(cleanup);

describe("TraderAvatar (D-013)", () => {
  it("shows initials when there is no picture", () => {
    const { container } = render(<TraderAvatar name="sorcerer.money" url={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("SM");
  });

  it("loads the picture lazily and sends no referrer", () => {
    const { container } = render(<TraderAvatar name="Kenobi" url="https://example.com/kenobi.png" />);
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("https://example.com/kenobi.png");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(image?.getAttribute("alt")).toBe("");
  });

  it("falls back to initials when the picture fails to load", () => {
    const { container } = render(<TraderAvatar name="Kenobi" url="https://example.com/broken.png" />);
    const image = container.querySelector("img");
    if (!image) throw new Error("expected an image before the failure");
    fireEvent.error(image);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("KE");
  });
});
