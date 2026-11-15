# ADR 001: Edge RAG Architecture & SLM Right-Sizing

- **Status:** Accepted (Updated by ADR 006 & ADR 008)
- **Context:** Need zero-cost edge hosting, sub-200ms Time-To-First-Token latency, resilience against upstream model deprecations, and strict hallucination prevention for Satyajit's portfolio.
- **Decision:** Use Astro 7 + Cloudflare Workers AI with `@cf/ibm-granite/granite-4.0-h-micro` as primary generator and `@cf/google/gemma-4-26b-a4b-it` as automatic fallback, paired with `@cf/baai/bge-small-en-v1.5` 384-dimension embeddings in Cloudflare Vectorize (`vraidaten-index`) and a calibrated 0.60 cosine similarity cutoff.
- **Rejected Alternatives:**
  - *Single Hardcoded Model Without Failover:* Rejected because Cloudflare model deprecations return `HTTP 410 Gone` (`5028`) without automatic redirection.
  - *Paid Vector DBs (Pinecone/Weaviate paid tiers):* Rejected due to zero-cost operational constraint.
