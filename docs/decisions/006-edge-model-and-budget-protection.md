# ADR 006: Resilient Primary/Fallback Edge Model Routing & Budget Protection

- **Status:** Accepted (Updated 2026-11-15)
- **Date:** 2026-11-13
- **Context:** Cloudflare Workers AI provides 10,000 Free Neurons daily. On November 5, 2026, Cloudflare announced the retirement of 24 models effective November 20, 2026 (including `@cf/meta/llama-3.1-8b-instruct-fp8`, `@cf/meta/llama-3.2-1b-instruct`, and `@cf/meta/llama-3.2-3b-instruct`), returning hard `HTTP 410 Gone` (`error code 5028`) responses without automatic rerouting.
- **Decision:**
  1. Standardize on `@cf/ibm-granite/granite-4.0-h-micro` as `MODEL_ID` (primary) and `@cf/google/gemma-4-26b-a4b-it` as `FALLBACK_MODEL_ID` in `site/wrangler.jsonc`. At 1,542 Neurons per 1M input tokens ($0.017) and 10,158 Neurons per 1M output tokens ($0.112), Granite 4.0 H Micro consumes ~2.04 Neurons per bounded RAG turn (~600 input + ~110 output tokens), supporting ~4,900 daily chats on the free tier.
  2. Implement `runChatStreamWithFallback()` in `site/src/pages/api/chat.ts` so any primary model error (`410 Gone` or upstream transient error) logs `"event": "model_fallback_triggered"` and fails over seamlessly to `FALLBACK_MODEL_ID`.
  3. Enforce input bounds (`MAX_PROMPT_LENGTH = 500`), calibrated cosine similarity filtering (`SIMILARITY_THRESHOLD = 0.60`), output caps (`MAX_OUTPUT_TOKENS = 256`, `temperature = 0.0`), and native edge rate limiting (`RATE_LIMITER`, 10 req/60s) to prevent runaway token drain.
