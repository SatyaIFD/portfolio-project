# ADR 001: Edge RAG Architecture & SLM Right-Sizing

- **Status:** Accepted (Model ID updated by ADR 006)
- **Context:** Need zero-cost edge hosting, sub-200ms Time-To-First-Token latency, and strict hallucination prevention.
- **Decision:** Use Astro + Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`, upgraded from initial `llama-3.2-1b-instruct` prototype per ADR 006) with `@cf/baai/bge-small-en-v1.5` embeddings and a 0.70 cosine similarity cutoff.
- **Rejected Alternatives:**
  - *Unquantized 8B+ LLMs:* Rejected due to higher latency and higher edge Neuron consumption.
  - *Paid Vector DBs (Pinecone/Weaviate paid tiers):* Rejected due to zero-cost operational constraint.
