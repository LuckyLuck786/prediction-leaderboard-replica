// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { formatStamp } from "@/lib/format";
import { LocalStamp } from "./local-stamp";

afterEach(cleanup);

const ISO = "2026-11-13T19:37:16.000Z";

describe("LocalStamp (FMT-08)", () => {
  it("renders UTC on the server and says so", () => {
    const html = renderToString(<LocalStamp iso={ISO} />);
    expect(html).toContain(`dateTime="${ISO}"`);
    expect(html).toContain("13 Nov, 19:37 UTC");
  });

  it("shows the viewer's local time in the browser", () => {
    const { container } = render(<LocalStamp iso={ISO} />);
    const time = container.querySelector("time");
    expect(time?.getAttribute("dateTime")).toBe(ISO);
    expect(time?.textContent).toBe(formatStamp(ISO));
  });
});
