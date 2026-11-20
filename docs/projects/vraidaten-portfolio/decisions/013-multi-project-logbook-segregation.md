# ADR 013: Multi-Project Logbook Segregation, Collision-Safe Vector IDs & Calm "Ask me" Launcher

- **Status:** Accepted
- **Date:** 2026-11-20
- **Context:** Keeping `decisions/` and `hurdles/` flat under `docs/` would cause future projects (such as the planned Google Cloud end-to-end implementation) to mix architectural records and troubleshooting logs with the VraiDaten portfolio website. Additionally, `rag_pipeline/ingest.py` previously generated chunk IDs from `file_path.stem` alone, which would silently overwrite vectors when two projects share filenames like `architecture.md` and risked exceeding Cloudflare Vectorize's 64-byte vector ID ceiling on long Hurdle filenames. Finally, `/logbook` omitted core specs (`architecture.md`, `requirements.md`, `known-limitations.md`), and the floating launcher needed a friendlier `"Ask me"` identity without distracting looping animations.
- **Decision:**
  1. Keep global career documentation at `docs/profile.md` and namespace every project under `docs/projects/<project-slug>/` containing its core Markdown specs, `decisions/`, and `hurdles/`.
  2. Update `site/src/pages/logbook.astro` to group projects automatically via Vite `import.meta.glob`, rendering Core Specifications, ADRs, and Operational Hurdles under per-project sections with jump navigation.
  3. Add `build_chunk_id(rel_path, idx)` in `rag_pipeline/ingest.py` using `<stem[:45]>-<sha256(rel_path)[:10]>-<idx:03d>` (capped at 60 bytes, always within Vectorize's 64-byte limit) and store POSIX relative paths in `source_file` metadata to prevent cross-project ID collisions.
  4. Upgrade the floating bottom-right launcher in `site/src/layouts/Layout.astro` to a calm, flat inline SVG face emblem paired with `"Ask me"` that stays still at rest and triggers a subtle tilt and single blink only on hover/focus (gated by `prefers-reduced-motion: no-preference`).
  5. Purge the 50 pre-refactor stem-only IDs from `vraidaten-index` before upserting the new path-hashed IDs so stale vectors cannot pollute RAG retrieval.
