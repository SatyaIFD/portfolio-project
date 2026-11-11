# ADR 005: Vectorize Embedding Generation & Metadata Co-location

- **Status:** Accepted
- **Date:** 2026-11-10
- **Context:** Cloudflare Vectorize requires pre-computed 384-dimensional float vectors formatted as NDJSON (`id`, `values`, `metadata`). Furthermore, when the edge Worker queries Vectorize for top-K matches, Vectorize returns only the vector ID, score, and metadata object.
- **Decision:**
  1. Implement `rag_pipeline/embed.py` using Python's native `http.client.HTTPSConnection` to batch-embed chunks via `@cf/baai/bge-small-en-v1.5` without external HTTP dependencies or `urllib` security warnings.
  2. Enforce runtime validation that every returned embedding matches `EXPECTED_DIMENSIONS = 384` before writing to disk.
  3. Co-locate the raw chunk `text` inside the Vectorize `metadata` payload alongside `source_file` and `git_commit`. This eliminates the need for a secondary KV or D1 database lookup during edge RAG inference, preserving $0/month operation and minimizing latency.
