// Asset check: the parts of CLAUDE.md's hard rules 3 to 5 a script can
// check. Whether an image, icon, font or sentence came from the source is
// decided by review, not here.
//
//   1. No tracked file lives in a folder reserved for raw captures of the
//      source site.
//   2. No tracked file refers to those folders, except the few that
//      describe them.
//   3. The source site's name appears only where rule 5 allows it.
//
// Run with: npm run check:assets. Exits 1 and lists every violation.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCE_NAME = JSON.parse(
  readFileSync(new URL("../src/upstream/source.json", import.meta.url), "utf8"),
).name;

/** Folders that hold raw captures of the source site. Never committed. */
export const CAPTURE_DIRS = [
  "docs/research/",
  "docs/design-references/",
  "public/sites/",
  "src/components/sites/",
];

/** Rule 5: the only places allowed to name the source site. */
export const ALLOWED_TO_NAME_SOURCE = [
  "README.md",
  "CLAUDE.md",
  "docs/",
  "src/upstream/",
  "scripts/check-assets.mjs",
  "scripts/check-assets.test.mjs",
];

/** Files that describe the capture folders: the rules files and the ignore rules. */
export const ALLOWED_TO_NAME_CAPTURE_DIRS = [...ALLOWED_TO_NAME_SOURCE, ".gitignore"];

const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|pdf)$/i;

// Compared in lower case: on a case-insensitive disk, Public/Sites is public/sites.
const isUnder = (file, prefixes) => {
  const lower = file.toLowerCase();
  return prefixes.some((prefix) => {
    const wanted = prefix.toLowerCase();
    return wanted.endsWith("/") ? lower.startsWith(wanted) : lower === wanted;
  });
};

/**
 * @param {{ path: string, content: string | null }[]} files tracked files;
 *   content is null for binary files
 * @param {string} sourceName
 * @returns {string[]} one message per violation
 */
export function findViolations(files, sourceName) {
  const violations = [];
  const needle = sourceName.toLowerCase();

  for (const { path, content } of files) {
    if (isUnder(path, CAPTURE_DIRS)) {
      violations.push(`${path}: tracked file inside a capture folder`);
      continue;
    }
    if (isUnder(path, ALLOWED_TO_NAME_SOURCE)) continue;
    const mayNameCaptureDirs = isUnder(path, ALLOWED_TO_NAME_CAPTURE_DIRS);
    // A file can name the source in its path as well as in its content.
    if (path.toLowerCase().includes(needle)) {
      violations.push(`${path}: file path names the source site`);
    }
    if (content === null) continue;

    const lines = content.split("\n");
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      if (lower.includes(needle)) {
        violations.push(`${path}:${index + 1}: names the source site`);
      }
      if (mayNameCaptureDirs) return;
      for (const dir of CAPTURE_DIRS) {
        if (lower.includes(dir)) {
          violations.push(`${path}:${index + 1}: refers to capture folder ${dir}`);
        }
      }
    });
  }

  return violations;
}

/** Tracked files plus new files that are not ignored: what a commit could contain. */
function candidatePaths() {
  const listing = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  });
  return [...new Set(listing.split("\0").filter(Boolean))];
}

/**
 * Reads the files to check. A path that git still lists but that has been
 * deleted in the working tree is on its way out, so it is skipped.
 * @param {string[]} paths
 */
export function loadFiles(paths) {
  return paths
    .filter((path) => existsSync(path))
    .map((path) => ({
      path,
      content: BINARY_EXTENSIONS.test(path) ? null : readFileSync(path, "utf8"),
    }));
}

function main() {
  const files = loadFiles(candidatePaths());
  const violations = findViolations(files, SOURCE_NAME);

  if (violations.length > 0) {
    console.error(`Asset check failed: ${violations.length} violation(s)`);
    for (const violation of violations) console.error(`  ${violation}`);
    process.exit(1);
  }
  console.log(`Asset check passed: ${files.length} files`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
