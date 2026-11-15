# Known Limitations & Operational Boundaries

1. **Free-Tier Quota Ceiling (10,000 Neurons/Day):** Cloudflare Workers AI free tier caps at 10,000 Neurons/day (~6,200 RAG turns/day using `@cf/ibm-granite/granite-4.0-h-micro` at ~1.61 Neurons/turn); extreme traffic spikes are throttled at the edge by `RATE_LIMITER` (10 requests/60s per client key).
2. **Short Query Ambiguity:** Single-word user queries may yield cosine similarity scores below the calibrated `0.60` threshold against multi-sentence Markdown chunks in `@cf/baai/bge-small-en-v1.5` embedding space, triggering deterministic refusal.
3. **Vectorize Asynchronous WAL Compaction:** Upserting or deleting vectors in Cloudflare Vectorize (`vraidaten-index`) via `make sync-vectors` exhibits a 5-to-12 second write-ahead log (WAL) compaction delay before newly indexed chunks are reflected in live edge queries.
