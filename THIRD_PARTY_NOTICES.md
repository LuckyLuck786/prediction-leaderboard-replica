# Third-party notices

## JCodesMore/ai-website-cloner-template

- Source: https://github.com/JCodesMore/ai-website-cloner-template
- Upstream commit this project started from: `5426e0e2ec35dbc173a7a18f47a3dfe2a765313e`
- License: MIT

This project started as a copy of that template. The first commit in this
repository's history contains the template files unchanged. The parts that
still derive from it are the Next.js, Tailwind CSS and shadcn/ui scaffold
(`package.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`,
`next.config.ts`, `components.json`, `src/app/globals.css`, `src/lib/utils.ts`,
`src/components/ui/`), the agent instructions in `AGENTS.md`, and the
`clone-website` skill under `.agents/skills/` and `.claude/commands/`.

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

## npm dependencies

Runtime and build dependencies are listed in `package.json` and pinned in
`package-lock.json`. Each package is distributed under its own license, which
ships inside `node_modules/<package>/` after `npm ci`.
