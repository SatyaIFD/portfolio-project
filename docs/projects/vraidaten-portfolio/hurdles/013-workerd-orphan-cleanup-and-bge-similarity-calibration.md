# Hurdle 013: workerd Orphan Cleanup, Cosine Threshold Calibration & Heading Context Merging

- **Symptoms:**
  1. Backgrounding `npx --prefix site wrangler dev` and running `kill $WRANGLER_PID` terminated the outer `npm` process but left the child `workerd` binary bound to `localhost:8787`, causing subsequent test runs to fail with `Address already in use`.
  2. Broad portfolio queries (`"Which LLM model and vector database power this portfolio?"`) achieved a cosine similarity score of `0.6404` in `@cf/baai/bge-small-en-v1.5` embedding space and were rejected by the initial `0.70` cutoff.
  3. Even after lowering `SIMILARITY_THRESHOLD` to `0.60`, the general portfolio query only sent `141` prompt tokens to the LLM and returned an unverified refusal.
  4. Compacting fragmented chunks from 48 down to 28 left 21 obsolete higher-index chunk IDs (`*-001`, `architecture-002`, `requirements-006`) in `vraidaten-index`.
- **Root Causes:**
  1. `npx` spawns a multi-process tree (`npm` -> `wrangler` -> `workerd`); signaling only the top-level PID orphans `workerd`.
  2. In 384-dimensional `@cf/baai/bge-small-en-v1.5` space, out-of-domain queries (`"sourdough bread"`) score `~0.456`, natural cross-document questions score `~0.640`, and exact ADR keyword queries score `~0.737`.
  3. Splitting Markdown strictly on `\n\n` in `rag_pipeline/ingest.py` isolated single-line `# Title` headings into standalone `*-000` chunks with zero body text. High-level queries matched three title-only stubs without retrieving the body paragraphs.
  4. `wrangler vectorize upsert` updates existing IDs in the payload but does not delete previously indexed chunk IDs that are no longer emitted.
- **Resolutions:**
  1. Invoked `./site/node_modules/.bin/wrangler` directly during local tests and cleaned up worker processes via `pkill -f "workerd|wrangler"`.
  2. Added non-PII retrieval metrics (`match_count`, `top_score`) to `logStructuredEvent` and calibrated `SIMILARITY_THRESHOLD` to `"0.60"` across `site/wrangler.jsonc`, `chat.ts`, ADR 001/002/006, and `requirements.md`.
  3. Added `merge_heading_blocks()` in `rag_pipeline/ingest.py` to prepend standalone `# Heading` lines to their following body paragraph.
  4. Computed the set difference between prior and current chunk IDs and pruned obsolete vector IDs using `wrangler vectorize delete-vectors`.
