# ADR 006: Edge Model Quantization & Rate Limiting

- **Status:** Accepted
- **Date:** 2026-11-13
- **Context:** Cloudflare Workers AI offers 10,000 Free Neurons daily. Generating a RAG response requires balancing execution speed (Time-To-First-Token) against budget preservation and scrape-resistance.
- **Decision:**
  1. Implement `@cf/meta/llama-3-8b-instruct-awq` as the default edge inference model. The `int4` quantized weights cut memory payload in half compared to `int8`, drastically reducing latency for the end user.
  2. A standard RAG query (~750 total tokens) burns ~11.25 Neurons, affording the portfolio site ~888 chats per day.
  3. Implemented a Cloudflare Rate Limiter in `site/wrangler.toml` and bound it to `env.RATE_LIMITER`. Keying the limiter to the `CF-Connecting-IP` header restricts each visitor to 5 chats per 60 seconds, preventing automated scrapers from exhausting the daily budget allocation.
