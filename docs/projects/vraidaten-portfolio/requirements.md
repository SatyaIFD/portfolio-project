# Requirements & Engineering Specifications

## 1. Business Problem & Intended Outcome
Provide recruiters and engineering leads with a fast (<200ms TTFT), verified portfolio and interactive AI assistant powered by Cloudflare Workers AI (`@cf/ibm-granite/granite-4.0-h-micro` primary with `@cf/google/gemma-4-26b-a4b-it` automatic fallback) and the Cloudflare Vectorize (`vraidaten-index`) vector database that answers questions strictly from grounded Markdown documentation without hallucination, operating at $0/month beyond the base domain registration cost.

## 2. Functional Requirements
- **FR1:** Serve static portfolio pages and architectural logs globally via Cloudflare Workers with Static Assets.
- **FR2:** Validate and chunk local Markdown documents with heading context preservation and Git commit lineage metadata.
- **FR3:** Answer visitor queries via the `/api/chat` edge RAG endpoint using `@cf/ibm-granite/granite-4.0-h-micro` (with automatic failover to `@cf/google/gemma-4-26b-a4b-it`) and `@cf/baai/bge-small-en-v1.5` embeddings.
- **FR4:** Refuse out-of-scope queries deterministically when cosine similarity < 0.60.
- **FR5:** Expose a zero-Neuron `GET /api/health` serviceability endpoint reporting binding health and active model configuration.

## 3. Non-Functional Requirements
- **Security & Privacy:** Enforce native edge rate limiting (`10 req/60s`); block PII inputs via regex; zero server-side IP or prompt logging (GDPR); label AI output per EU AI Act Article 50; store local CLI credentials in Ubuntu's encrypted OS Keyring (`libsecret`).
- **Reliability & Performance:** Static asset delivery <100ms; edge RAG streaming TTFT <200ms; automatic primary-to-fallback LLM failover; 100% sampled Workers Logs & Traces.
- **Cost:** Strictly $0/month operational spend within Cloudflare free-tier quotas (10,000 Neurons/day, ~4,900 chats/day with Granite 4.0 H Micro).
- **Maintainability:** 100% pass rate on Ruff, Mypy, TypeScript (`tsc --noEmit`), Bandit, pip-audit, npm audit, detect-secrets, Trivy, and Pytest (>=80% coverage).

## 4. Input & Output Schemas
- **Chat Request Schema (JSON):** `{"prompt": string (1 to 250 chars, non-empty, no PII)}`
- **Knowledge Chunk Schema:** `{"chunk_id": string, "source_file": string, "content": string, "git_commit": string}`
- **Chat Response Schema:** `text/event-stream` (SSE tokens) or deterministic plain-text error/refusal string.
- **Health Response Schema (JSON):** `{"status": "healthy" | "degraded", "request_id": string, "timestamp": string, "bindings": object, "config": object}`

## 5. Failure Scenarios & Expected Behaviour
- **Rate Limit Exceeded (>10 req/60s):** Return HTTP 429 before invoking Workers AI or Vectorize.
- **PII Detected in Prompt:** Return HTTP 403 without calling embedding or LLM APIs.
- **Payload Empty or >500 Chars:** Return HTTP 400 validation error.
- **Vector Similarity < 0.60 in Cloudflare Vectorize (`vraidaten-index`) Vector Database:** Return HTTP 200 deterministic refusal message without calling the `@cf/ibm-granite/granite-4.0-h-micro` LLM (0 LLM tokens used).
- **Primary LLM Deprecated (HTTP 410) or Transiently Unavailable:** Log `model_fallback_triggered` and automatically stream from `FALLBACK_MODEL_ID`.
- **Downstream AI/Vector Timeout:** Catch exception, log structured event ID, return generic HTTP 500 without leaking stack traces.

## 6. Acceptance Criteria
- All 19 Definition of Done items verified prior to merging any pull request into `main`.
