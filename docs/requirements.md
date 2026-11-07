# Requirements & Engineering Specifications

## 1. Business Problem & Intended Outcome
Provide recruiters and engineering leads with a fast (<200ms TTFT), verified portfolio and interactive AI assistant that answers questions strictly from grounded Markdown documentation without hallucination, operating at $0/month beyond the base domain registration cost.

## 2. Functional Requirements
- **FR1:** Serve static portfolio pages and architectural logs globally via CDN.
- **FR2:** Validate and chunk local Markdown documents with Git commit lineage metadata.
- **FR3:** Answer visitor queries via an edge RAG endpoint using a 1B-3B parameter SLM.
- **FR4:** Refuse out-of-scope queries deterministically when cosine similarity < 0.70.

## 3. Non-Functional Requirements
- **Security & Privacy:** Block PII inputs via regex; zero server-side IP or prompt logging (GDPR); label AI output per EU AI Act Article 50.
- **Reliability & Performance:** Static asset delivery <100ms; edge RAG streaming TTFT <200ms.
- **Cost:** Strictly $0/month operational spend within Cloudflare free-tier quotas.
- **Maintainability:** 100% pass rate on Ruff, Mypy, Bandit, pip-audit, detect-secrets, Trivy, and Pytest (>=80% coverage).

## 4. Input & Output Schemas
- **Chat Request Schema (JSON):** `{"prompt": string (1 to 500 chars, non-empty, no PII)}`
- **Knowledge Chunk Schema:** `{"chunk_id": string, "source_file": string, "content": string, "git_commit": string}`
- **Chat Response Schema:** `text/event-stream` (SSE tokens) or deterministic JSON error/refusal string.

## 5. Failure Scenarios & Expected Behaviour
- **PII Detected in Prompt:** Return HTTP 403 without calling embedding or LLM APIs.
- **Payload Empty or >500 Chars:** Return HTTP 400 validation error.
- **Vector Similarity < 0.70:** Return HTTP 200 deterministic refusal message (0 LLM tokens used).
- **Downstream AI/Vector Timeout:** Catch exception, log structured event ID, return generic HTTP 500 without leaking stack traces.

## 6. Acceptance Criteria
- All 19 Definition of Done items verified prior to merging any pull request into `main`.
