# Hurdle 008: Wrangler Config Consolidation & Edge-to-Python Schema Parity

- **Symptoms:**
  1. Both `site/wrangler.jsonc` and `site/wrangler.toml` existed in `site/` with mismatched Vectorize binding names (`VECTOR_INDEX` vs `VECTORIZE`) and index names (`vraidaten-knowledge-index` vs `vraidaten-index`).
  2. An intermediate draft of `site/functions/api/chat.ts` dropped the ADR 002 `PII_REGEX`, `SIMILARITY_THRESHOLD` (`0.70`), `MAX_PROMPT_LENGTH` (`500`), and structured telemetry logger, and referenced a deprecated `llama-3-8b-instruct-awq` model.
  3. Original `chat.ts` read `metadata.content`, whereas `rag_pipeline/embed.py` populated `metadata.text`.
- **Root Causes:**
  1. Creating `site/wrangler.toml` during Vectorize setup duplicated the existing `site/wrangler.jsonc` file created during ADR 002.
  2. Overwriting `chat.ts` without inspecting commit `7139866` regressed the security and telemetry contracts established in ADR 002.
- **Resolutions:**
  1. Removed `site/wrangler.toml` and consolidated all bindings (`AI`, `VECTOR_INDEX` -> `vraidaten-index`) and runtime `vars` inside `site/wrangler.jsonc`.
  2. Restored the ADR 002 validation, telemetry, and SSE streaming contract in `chat.ts` with zero `any` types, updated `MODEL_ID` to `@cf/meta/llama-3.1-8b-instruct-fp8-fast`, and bridged `match.metadata?.text || match.metadata?.content`.
