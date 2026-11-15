import { describe, expect, it } from "vitest";

import { findViolations, loadFiles } from "./check-assets.mjs";

const NAME = "example-source.test";
const file = (path, content = "") => ({ path, content });

describe("asset check", () => {
  it("passes clean application code", () => {
    expect(findViolations([file("src/app/page.tsx", "export default 1;")], NAME)).toEqual([]);
  });

  it("flags a tracked file inside a capture folder", () => {
    const violations = findViolations(
      [file("public/sites/source/logo.svg", "<svg/>"), { path: "docs/research/shot.png", content: null }],
      NAME,
    );
    expect(violations).toHaveLength(2);
    expect(violations[0]).toContain("capture folder");
  });

  it("flags application code that names the source, with file and line", () => {
    const violations = findViolations(
      [file("src/app/page.tsx", `const a = 1;\nconst site = "Example-Source.test";`)],
      NAME,
    );
    expect(violations).toEqual(["src/app/page.tsx:2: names the source site"]);
  });

  it("flags application code that refers to a capture folder", () => {
    const violations = findViolations(
      [file("src/app/page.tsx", `import logo from "../../public/sites/source/logo.svg";`)],
      NAME,
    );
    expect(violations).toEqual(["src/app/page.tsx:1: refers to capture folder public/sites/"]);
  });

  it("lets the allowed files name the source", () => {
    const allowed = [
      file("README.md", NAME),
      file("docs/SPEC.md", NAME),
      file("src/upstream/source.json", NAME),
      file(".gitignore", "docs/research/"),
    ];
    expect(findViolations(allowed, NAME)).toEqual([]);
  });

  it("refuses capture folders and the source's name in AGENTS.md, which holds only Next's note", () => {
    expect(findViolations([file("AGENTS.md", "public/sites/<site>/")], NAME)).toHaveLength(1);
    expect(findViolations([file("AGENTS.md", NAME)], NAME)).toHaveLength(1);
  });

  it("does not treat a similarly named file as allowed", () => {
    expect(findViolations([file("src/README.md.tsx", NAME)], NAME)).toHaveLength(1);
  });

  it("sees through a change of letter case in a capture folder", () => {
    const violations = findViolations(
      [file("Public/Sites/source/logo.svg", "<svg/>"), file("DOCS/Research/notes.md", "notes")],
      NAME,
    );
    expect(violations).toHaveLength(2);
    expect(violations.every((message) => message.includes("capture folder"))).toBe(true);
  });

  it("flags a file whose path names the source, even a binary one", () => {
    const violations = findViolations(
      [{ path: `public/brand/${NAME}.png`, content: null }, file(`src/${NAME.toUpperCase()}/x.ts`, "")],
      NAME,
    );
    expect(violations).toEqual([
      `public/brand/${NAME}.png: file path names the source site`,
      `src/${NAME.toUpperCase()}/x.ts: file path names the source site`,
    ]);
  });
});

describe("loadFiles", () => {
  it("skips a listed path that no longer exists on disk", () => {
    expect(loadFiles(["this/file/was/deleted.txt"])).toEqual([]);
  });

  it("reads text files and leaves binary files unread", () => {
    const files = loadFiles(["package.json", "public/brand/missing.png"]);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("package.json");
    expect(files[0].content).toContain('"name"');
  });
});
