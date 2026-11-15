# Third-party notices

## JCodesMore/ai-website-cloner-template

- Source: https://github.com/JCodesMore/ai-website-cloner-template
- Upstream commit this project started from: `5426e0e2ec35dbc173a7a18f47a3dfe2a765313e`
- License: MIT

This project started as a copy of that template. The first commit in this
repository's history contains the template files unchanged. The parts that
still derive from it are the Next.js and Tailwind CSS scaffold
(`package.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`,
`next.config.ts`, `src/app/globals.css`, `src/lib/utils.ts`), the agent
instructions in `AGENTS.md`, and the `clone-website` skill under
`.agents/skills/` and `.claude/commands/`. The template's shadcn/ui
component and configuration were removed (docs/DECISIONS.md, D-055).

Those portions remain under the MIT License, reproduced below.

```
MIT License

Copyright (c) 2025 JCodesMore

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Packages shipped in the deployed site

Code from these packages is part of what visitors download. Each one's full
license text ships inside `node_modules/<package>/` after `npm ci`; Next.js
also carries the licenses of the code it bundles.

| Package | Version | License |
|---|---|---|
| next | 16.4.6 | MIT |
| react | 19.2.4 | MIT |
| react-dom | 19.2.4 | MIT |
| zod | 4.6.7 | MIT |
| clsx | 2.1.1 | MIT |
| tailwind-merge | 3.5.0 | MIT |
| lucide-react (icons) | 1.6.0 | ISC |

## Development tools

Build, test and lint tools are listed in `package.json` and pinned in
`package-lock.json`; none of their code is shipped. Of note: Playwright
(Apache-2.0) drives the end-to-end tests and axe-core (MPL-2.0, through
`@axe-core/playwright`) runs the accessibility checks. Lighthouse
(Apache-2.0) is run through `npx` and is not a dependency.
