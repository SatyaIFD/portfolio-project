# ADR 004: Cloudflare Vectorize Index Geometry & Edge Bindings

- **Status:** Accepted (Consolidated in `site/wrangler.jsonc`)
- **Date:** 2026-11-08
- **Context:** The edge RAG assistant requires a managed vector database that operates within our $0/month cost ceiling and integrates natively with Cloudflare Workers AI (`@cf/baai/bge-small-en-v1.5`).
- **Decision:**
  1. Provision a Cloudflare Vectorize index (`vraidaten-index`) configured with `dimensions=384` and `metric=cosine` to match the exact output tensor shape of `@cf/baai/bge-small-en-v1.5`.
  2. Bind both Workers AI (`env.AI`) and Vectorize (`env.VECTOR_INDEX` pointing to `vraidaten-index`) inside `site/wrangler.jsonc` so edge functions authenticate via Cloudflare IAM bindings rather than static secrets.
  3. Generate embeddings for `rag_pipeline/vectorize_payload.jsonl` and batch-upload vectors using `wrangler vectorize upsert` so updated documentation chunks overwrite existing chunk IDs idempotently.
