# ADR 011: Build-Time Markdown AST Rendering, Dynamic Logbook Counts & Location Positioning

- **Status:** Accepted (Updated 2026-11-19)
- **Date:** 2026-11-19
- **Context:** A technical portfolio must prevent documentation drift between Cloudflare Vectorize (`vraidaten-index`) and the public `/logbook` page, render Markdown cleanly (rather than raw `**` or backtick syntax) in both `/logbook` and streamed Edge AI chat responses without introducing third-party XSS risks or npm supply-chain dependencies, and clearly state location and work-mode preferences while protecting personal privacy (omitting exact DOB from public pages).
- **Decision:**
  1. Implement a zero-dependency TypeScript Markdown AST parser (`site/src/utils/markdown.ts`) shared between `site/src/pages/logbook.astro` (rendered via auto-escaped Astro JSX) and `site/src/scripts/chat-client.ts` (rendered via `document.createElement` and `document.createTextNode`, with zero `innerHTML`).
  2. Derive ADR and Hurdle counts dynamically at build time via Vite `import.meta.glob` across `/` and `/projects` so displayed counts never drift out of sync with `docs/`.
  3. Communicate Satyajit's base location (**Born and raised in Kolkata, India · IST / UTC+5:30**) and explicit work modes—**Domestic:** Kolkata On-Site/Hybrid preferred, Rest of India Remote (flexible depending on offer); **Global EOR:** Remote; **B2B:** Remote team collaborator—while keeping exact DOB private for identity security and global anti-bias compliance.
