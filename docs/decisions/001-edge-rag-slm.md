# ADR 001: Edge RAG Architecture & 1B-3B SLM Right-Sizing

- **Status:** Accepted
- **Context:** Need zero-cost hosting, local testability on a 3GB VRAM GTX 1060, and sub-200ms latency.
- **Decision:** Use Astro + Cloudflare Workers AI (`llama-3.2-1b-instruct`) with a 0.70 cosine similarity cutoff.
- **Rejected Alternatives:**
  - *8B+ LLMs:* Rejected due to 5.2GB VRAM requirement exceeding local 3GB GPU and 4x higher edge neuron cost.
  - *Paid Vector DBs (Pinecone/Weaviate paid tiers):* Rejected due to zero-cost operational constraint.
