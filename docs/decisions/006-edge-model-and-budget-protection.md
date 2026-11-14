# ADR 006: FP8-Fast Edge Model Selection, Token Bounding & Budget Protection

- **Status:** Accepted (Updated 2026-11-14)
- **Date:** 2026-11-13
- **Context:** Cloudflare Workers AI provides 10,000 Free Neurons daily. Earlier AWQ (`int4`) Llama 3 models were deprecated by Cloudflare on May 30, 2026, and output tokens consume roughly 8.5x more Neurons than input tokens.
- **Decision:**
  1. Standardize on `@cf/meta/llama-3.1-8b-instruct-fp8-fast` in `site/wrangler.jsonc`. At 4,119 Neurons per 1M input tokens and 34,868 Neurons per 1M output tokens, a bounded RAG turn (~550 input tokens + ~110 output tokens) consumes ~6.07 Neurons, supporting ~1,600 daily chats on the free tier.
  2. Enforce input bounds (`MAX_PROMPT_LENGTH = 500`), calibrated cosine similarity filtering (`SIMILARITY_THRESHOLD = 0.60`), and output caps (`MAX_OUTPUT_TOKENS = 256`, `temperature = 0.0`) to prevent runaway token drain.
  3. Support edge rate limiting (`RATE_LIMITER`) and WAF rules while preserving ADR 002 GDPR telemetry guarantees (never logging raw prompts or client IP addresses).
