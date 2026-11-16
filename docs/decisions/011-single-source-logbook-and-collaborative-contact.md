# ADR 011: Build-Time Markdown Logbook Synchronization & Collaborative Positioning

- **Status:** Accepted
- **Date:** 2026-11-16
- **Context:** A technical portfolio must prevent documentation drift between what the Edge RAG assistant retrieves from Cloudflare Vectorize (`vraidaten-index`) and what human visitors read on the website. Additionally, career-transition framing must clearly specify preferred working arrangements (Domestic, EOR, or B2B team collaboration) and maintain accessible contrast across both Light and Dark themes.
- **Decision:**
  1. Implement `site/src/pages/logbook.astro` using Node.js `fs` and `path` at Astro build time to read `docs/decisions/*.md` and `docs/hurdles/*.md` directly from the repository into native HTML `<details>` disclosures—ensuring zero runtime latency and a single source of truth shared with `rag_pipeline/ingest.py`.
  2. Implement `site/src/pages/contact.astro` and `site/src/pages/projects.astro` with explicit status badges (`Live in Production` vs. `In Development`) and clear collaborative role models (Domestic, Global EOR, and Embedded B2B).
  3. Update `site/src/scripts/chat-client.ts` message bubbles and `site/src/layouts/Layout.astro` navigation so both Light Mode (`#F4F2EC`) and Dark Mode (`#0F1115`) maintain accessible typography and mobile reachability.
