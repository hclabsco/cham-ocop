# AGENTS.md — Chấm OCOP

Static Astro site at ocop.hclabs.co. Read README.md first.

- Source of truth: QĐ 26/2026/QĐ-TTg, `public/nguon/qd-26-2026-ttg.pdf`. Never change a number in
  `src/data/sheets.json` without the PDF page that shows it; add a hand-read test in `test/sheets.test.ts`.
- Logic lives in `src/lib/` and is tested (vitest, TDD). Page scripts in `src/scripts/` only wire DOM to it.
- No external request from any page (fonts are self-hosted at build). `scripts/check-dist.mjs` fails the build otherwise.
- Copy is Vietnamese, "anh chị" voice, no claims that are not backed by a document. Design tokens follow
  hclabs.co DESIGN.md. Never use Be Vietnam Pro.
- Commands: `corepack pnpm test`, `corepack pnpm check`, `corepack pnpm build`.
- Deploy is CI only (push `main`). Hostname is managed in the `infra` repo (OpenTofu).
