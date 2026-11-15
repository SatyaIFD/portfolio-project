# Vraidaten Portfolio & Edge RAG Platform (`vraidaten.com`)

Production MLOps, Cloud Architecture, and DevSecOps portfolio engineered by **Satyajit**. Built with **Astro 7**, **Tailwind CSS v4**, **Cloudflare Workers with Static Assets**, **Cloudflare Vectorize (`vraidaten-index`)**, and **Cloudflare Workers AI** operating at **$0/month** within Cloudflare free-tier quotas.

## Architecture Highlights
- **Resilient Edge RAG (`/api/chat`):** Powered by `@cf/ibm-granite/granite-4.0-h-micro` (~1.61 Neurons/turn) with automatic failover to `@cf/google/gemma-4-26b-a4b-it` against `HTTP 410 Gone` model retirements or transient upstream errors.
- **384-Dim Vectorize Index (`vraidaten-index`):** Local Markdown ingestion (`rag_pipeline/ingest.py`) merges standalone headings into section bodies (`merge_heading_blocks`), stamps Git commit SHA lineage metadata, and embeds via `@cf/baai/bge-small-en-v1.5` with a calibrated `0.60` cosine similarity cutoff (`VECTOR_TOP_K = 4`).
- **Security, Privacy & Compliance:**
  - **GDPR Zero-PII Telemetry:** Blocks PII inputs via regex (`HTTP 403`) and logs 100% sampled structured JSON metrics (`request_id`, `event`, `status`, `latency_ms`, `match_count`, `top_score`, `matched_ids`, `model_used`) with zero raw prompt or client IP logging.
  - **EU AI Act Article 50:** Explicit in-UI transparency disclosure and live `/api/health` zero-Neuron binding status indicator.
  - **OS Keyring Secret Management:** Uses Ubuntu `libsecret` (`secret-tool`) for process-scoped credential injection with zero plaintext `.env` files.

## Developer & Operations Commands
- `make all` — Run Ruff format/check, Mypy, TypeScript (`wrangler types && astro sync && tsc --noEmit`), Bandit, pip-audit, npm audit, detect-secrets, and Pytest (98.78% coverage achieved).
- `make sync-vectors` — Ingest `docs/**/*.md`, embed via OS keyring credentials, and upsert vectors into `vraidaten-index`.
- `make deploy` — Build the Astro 7 static + server Worker bundle and deploy to Cloudflare Edge (`vraidaten.com` & `www.vraidaten.com`).
