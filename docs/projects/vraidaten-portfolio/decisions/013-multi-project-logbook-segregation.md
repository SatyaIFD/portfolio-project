# ADR 013: Multi-Project Logbook Segregation, Progressive Disclosure, Collision-Safe Vector IDs & Calm "Ask me" Launcher

- **Status:** Accepted (Updated 2026-11-20)
- **Date:** 2026-11-20
- **Context:** Keeping `decisions/` and `hurdles/` flat under `docs/` would mix future projects (such as the planned Google Cloud end-to-end implementation) with the VraiDaten portfolio website. Additionally, rendering all specs, ADRs, and Hurdles expanded at once creates an overly long scroll page as projects accumulate. Finally, `rag_pipeline/ingest.py` previously used bare filename stems for chunk IDs (risking cross-project overwrites and exceeding Cloudflare Vectorize's 64-byte ID ceiling), and `site/src/utils/markdown.ts` left raw backticks inside bold headings.
- **Decision:**
  1. Keep global career documentation at `docs/profile.md` and namespace every project under `docs/projects/<project-slug>/` containing its Core Specifications, `decisions/`, and `hurdles/`.
  2. Render `/logbook` as a 3-level collapsed-by-default accordion (**Project Card → Category Folder → Individual Document**) using Tailwind named groups (`group/project`, `group/category`, `group/doc`) and a shared `MarkdownBlocks.astro` component so the page stays compact regardless of how many projects are added.
  3. Upgrade `site/src/utils/markdown.ts` and `chat-client.ts` to parse inline code spans nested inside bold and italic tokens while maintaining zero `innerHTML` usage.
  4. Use `build_chunk_id(rel_path, idx)` (`<stem[:45]>-<sha256(rel_path)[:10]>-<idx:03d>`, max 60 bytes) and POSIX relative `source_file` metadata in `rag_pipeline/ingest.py`.
  5. Use a calm inline SVG face emblem paired with `"Ask me"` in `Layout.astro` that remains still at rest and triggers a subtle tilt and single blink only on hover/focus (gated by `prefers-reduced-motion: no-preference`).
