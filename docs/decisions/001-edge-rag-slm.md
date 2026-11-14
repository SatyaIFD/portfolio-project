# ADR 001: Edge RAG Architecture & SLM Right-Sizing

- **Status:** Accepted (Model ID & Threshold updated by ADR 006 & Hurdle 013)
- **Context:** Need zero-cost edge hosting, sub-200ms Time-To-First-Token latency, and strict hallucination prevention for Satyajit's portfolio.
- **Decision:** Use Astro + Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`, upgraded from initial `llama-3.2-1b-instruct` prototype per ADR 006) with `@cf/baai/bge-small-en-v1.5` 384-dimension embeddings in Cloudflare Vectorize (`vraidaten-index`) and a calibrated 0.60 cosine similarity cutoff.
- **Rejected Alternatives:**
  - *Unquantized 8B+ LLMs:* Rejected due to higher latency and higher edge Neuron consumption.
  - *Paid Vector DBs (Pinecone/Weaviate paid tiers):* Rejected due to zero-cost operational constraint.
