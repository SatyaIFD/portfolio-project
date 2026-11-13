# Hurdle 009: Vectorize Upsert Semantics, WAL Compaction Lag & Fail-Safe Chaining

- **Symptoms:**
  1. When `rag_pipeline.embed` exited with an HTTP `401` authentication error during a multi-line shell paste, the subsequent `wrangler vectorize insert` command still executed and uploaded the previous 30-vector `.ndjson` file.
  2. Running `wrangler vectorize info` immediately after enqueueing 40 vectors still displayed `vectorCount: 30` and the previous mutation timestamp.
  3. Re-running `wrangler vectorize insert` does not overwrite metadata for chunk IDs that already exist in the index.
- **Root Causes:**
  1. Separating pipeline commands with newlines instead of `&&` allowed the upload step to run even after the embedding generator failed.
  2. Cloudflare Vectorize processes batch mutations asynchronously via a Write-Ahead Log (WAL) changeset queue that takes roughly 10 to 15 seconds to compact.
  3. In Cloudflare Vectorize, `insert` follows first-write-wins semantics (ignoring duplicate IDs), whereas `upsert` follows last-write-wins semantics (overwriting existing IDs with new vectors and metadata).
- **Resolutions:**
  1. Chained `rag_pipeline.ingest`, `rag_pipeline.embed`, and the Wrangler upload command with `&&`, and added a token character-length echo (`${#CF_AI_CREDENTIAL}`) to confirm silent `read -rs` pastes before calling the API.
  2. Standardized on `wrangler vectorize upsert` in ADR 004 so modified Markdown chunks overwrite prior vectors in-place.
  3. Added a 10-second wait before polling `wrangler vectorize info` to allow asynchronous WAL mutation compaction to complete.
