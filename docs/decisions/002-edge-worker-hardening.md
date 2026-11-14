# ADR 002: Edge Worker Security, Schema Parity, and Structured Telemetry

- **Status:** Accepted (Updated 2026-11-14)
- **Date:** 2026-11-06
- **Context:** The initial `chat.ts` endpoint contained hardcoded model identifiers, lacked the 1-500 character input boundary enforced in Python (`rag_pipeline/schemas.py`), and lacked operational retrieval observability.
- **Decision:**
  1. Externalize all model IDs, similarity thresholds (`SIMILARITY_THRESHOLD = "0.60"`), and CORS origins to `site/wrangler.jsonc`.
  2. Enforce strict TypeScript type checking, 1-500 character bounds, and PII regex blocking before calling Workers AI.
  3. Emit structured JSON logs containing `request_id`, `event`, `status`, `latency_ms`, and non-PII vector retrieval metrics (`match_count`, `top_score`) while never logging user prompts or IP addresses (GDPR compliance).
