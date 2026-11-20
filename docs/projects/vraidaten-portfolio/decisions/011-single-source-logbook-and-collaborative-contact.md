# ADR 011: Build-Time Markdown AST Rendering, Project-Segregated Logbook & Location Positioning

- **Status:** Accepted (Updated 2026-11-20; extended by ADR 013)
- **Date:** 2026-11-20
- **Context:** A multi-project technical portfolio must prevent documentation drift between Cloudflare Vectorize (`vraidaten-index`) and the public `/logbook` page, keep each project's documentation cleanly segregated under `docs/projects/<slug>/`, render Markdown cleanly in both `/logbook` and streamed Edge AI responses without third-party XSS risks, and clearly state location and work-mode preferences while keeping exact DOB private.
- **Decision:**
  1. Share a zero-dependency TypeScript Markdown AST parser (`site/src/utils/markdown.ts`) between `site/src/pages/logbook.astro` (Astro JSX) and `site/src/scripts/chat-client.ts` (safe DOM node construction, zero `innerHTML`).
  2. Discover Core Specifications, ADRs, and Operational Hurdles dynamically per project from `docs/projects/<slug>/` via Vite `import.meta.glob` across `/`, `/projects`, and `/logbook`.
  3. Communicate Satyajit's base location (**Born and raised in Kolkata, India · IST / UTC+5:30**) and explicit work modes—**Domestic:** Kolkata On-Site/Hybrid preferred, Rest of India Remote (flexible depending on offer); **Global EOR:** Remote; **B2B:** Remote team collaborator—while omitting exact DOB from public pages.
