# Hurdle 020: Paragraph Fragmentation, Low Top-K Recall & Award/Certification Conflation in Edge RAG

- **Symptoms:**
  1. Asking `/api/chat` *"What certifications and learning milestones has Satyajit completed?"* returned TCS employer awards instead of his Cisco Linux Essentials badge, IBM Cognitive Class certificate, Simplilearn Data Scientist program, and in-progress Google Cloud Professional ML Engineer (Target: December 2026) track.
  2. Asking *"What is Satyajit's background at TCS and what roles is he targeting?"* answered the TCS tenure accurately but refused the target roles half, and failed to surface his active/planned project roadmap.
- **Root Causes:**
  1. `rag_pipeline/ingest.py` split Markdown on every blank line (`\n\n`), fragmenting `docs/profile.md` into 10 disconnected chunks. Later chunks (`Verified External Credentials`, `Target Roles`) were written in first person without the `# Satyajit Chakraborty` title, causing `bge-small-en-v1.5` to rank chunks explicitly containing `"Satyajit"` and `"TCS"` (such as the TCS Awards block) above them.
  2. `VECTOR_TOP_K` (`4`) and `MAX_OUTPUT_TOKENS` (`256`) in `site/wrangler.jsonc` were too tight for multi-part profile questions, and `docs/profile.md` lacked dedicated top-level sections for the December 2026 GCP Professional ML Engineer track and Current/Planned Projects.
  3. The one-line system prompt in `site/src/pages/api/chat.ts` did not instruct `@cf/ibm-granite/granite-4.0-h-micro` to separate employer awards from technical certifications or enforce consistent bullet formatting.
- **Resolutions:**
  1. Replaced `\n\n` paragraph splitting with `split_markdown_sections()` in `rag_pipeline/ingest.py`, keeping each `##`/`###` section cohesive while prepending the document's `#` title and parent `##` heading to every chunk.
  2. Restructured `docs/profile.md` and `site/src/pages/index.astro` with explicit, clearly titled sections for **Technical Certifications & Learning Milestones** (highlighting the **December 2026 Google Cloud Professional ML Engineer** target) and **Current & Planned Practical Projects**.
  3. Increased `VECTOR_TOP_K` to `6` and `MAX_OUTPUT_TOKENS` to `600` (with a concise-completion rule to prevent mid-sentence truncation) while tightening `MAX_PROMPT_LENGTH` to `250` characters across both Python (`rag_pipeline/schemas.py`) and Cloudflare Edge (`site/wrangler.jsonc`) in `site/wrangler.jsonc`, tightened the system prompt in `site/src/pages/api/chat.ts`, purged orphaned pre-refactor chunk IDs from `vraidaten-index`, and re-synced via `make sync-vectors`.
