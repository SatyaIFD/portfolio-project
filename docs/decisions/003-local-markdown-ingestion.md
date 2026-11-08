# ADR 003: Local Markdown Ingestion & JSONL Export

- **Status:** Accepted
- **Date:** 2026-11-08
- **Context:** The Cloudflare Vectorize and Workers AI APIs require vector data to be batch-uploaded. We need a way to parse local Markdown documentation, chunk it, and format it for the edge.
- **Decision:** 
  1. Use a local Python script (`rag_pipeline/ingest.py`) to parse `.md` files by double-newlines (paragraphs).
  2. Embed the Git commit SHA into every chunk's metadata for strict data lineage.
  3. Export the payload as a JSON Lines (`.jsonl`) file, which is the native, most memory-efficient format for Cloudflare Workers AI batch processing.
