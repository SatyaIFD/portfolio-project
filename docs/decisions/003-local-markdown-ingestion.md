# ADR 003: Local Markdown Ingestion, Dynamic Discovery & JSONL Export

- **Status:** Accepted (Updated 2026-11-09)
- **Context:** The Cloudflare Vectorize and Workers AI APIs require vector data to be batch-uploaded. Static file lists and magic constants create maintenance drift as new ADRs and Hurdle logs are added.
- **Decision:**
  1. Use `rag_pipeline/ingest.py` to recursively discover all `.md` files inside `RAG_DOCS_DIR` (default `docs/`) via `sorted(docs_dir.rglob("*.md"))`, automatically indexing new ADRs and Hurdle logs.
  2. Resolve runtime input/output paths via environment variables (`RAG_DOCS_DIR`, `RAG_OUTPUT_FILE`) and enforce Ruff rule `PLR2004` to prevent magic numbers.
  3. Embed the short Git commit SHA into every chunk's metadata and export as JSON Lines (`.jsonl`).
