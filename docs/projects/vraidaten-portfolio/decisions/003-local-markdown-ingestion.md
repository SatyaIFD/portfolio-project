# ADR 003: Local Markdown Ingestion, Dynamic Discovery & JSONL Export

- **Status:** Accepted (Updated 2026-11-14)
- **Context:** The Cloudflare Vectorize and Workers AI APIs require vector data to be batch-uploaded. Naive double-newline (`\n\n`) splitting isolates single-line `# Title` headings from their body paragraphs, creating context-free header stubs in the vector index.
- **Decision:**
  1. Use `rag_pipeline/ingest.py` to recursively discover all `.md` files inside `RAG_DOCS_DIR` (default `docs/`) via `sorted(docs_dir.rglob("*.md"))`, automatically indexing new ADRs and Hurdle logs.
  2. Merge standalone single-line Markdown headings (`merge_heading_blocks`) into the following paragraph block so every chunk preserves both its section title and body content.
  3. Resolve runtime input/output paths via environment variables (`RAG_DOCS_DIR`, `RAG_OUTPUT_FILE`), enforce Ruff rule `PLR2004`, and embed the short Git commit SHA into every chunk's metadata.
