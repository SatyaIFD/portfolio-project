# Vraidaten Portfolio & Edge AI Assistant (`vraidaten.com`)

Career-transition portfolio and grounded Edge RAG assistant for **Satyajit Chakraborty** (9 years 5 months in Business Operations at Tata Consultancy Services, transitioning into **Cloud Engineering, Cloud ML, Cloud Operations, and MLOps**). Built with **Astro 7**, **Tailwind CSS v4**, **Cloudflare Workers with Static Assets**, **Cloudflare Vectorize (`vraidaten-index`)**, and **Cloudflare Workers AI** operating at **$0/month** within Cloudflare free-tier quotas.

## Architecture Highlights
- **Floating Edge RAG Assistant (`/api/chat`):** Powered by `@cf/ibm-granite/granite-4.0-h-micro` (~1.61 Neurons/turn) with automatic failover to `@cf/google/gemma-4-26b-a4b-it`, accessible across all pages via a viewport-fixed floating corner button.
- **384-Dim Vectorize Index (`vraidaten-index`):** Local Markdown ingestion (`rag_pipeline/ingest.py`) chunks `docs/**/*.md` (including `profile.md`, ADRs, and Hurdles), stamps Git commit SHA lineage metadata, and embeds via `@cf/baai/bge-small-en-v1.5` with a calibrated `0.60` cosine similarity cutoff.
- **Compile-Time Synchronized Engineering Logbook (`/logbook`):** Uses Vite `import.meta.glob` (`?raw`) to compile all repository ADRs and Operational Hurdle logs directly into static HTML at build time.
- **Security, Privacy & Quality Hygiene:**
  - **GDPR Zero-PII Telemetry & EU AI Act Art. 50 Disclosure:** Blocks PII inputs via regex (`HTTP 403`) and logs structured JSON metrics with zero raw prompt or client IP storage.
  - **OS Keyring Secret Management:** Uses Ubuntu `libsecret` (`secret-tool`) for process-scoped credential injection with zero plaintext `.env` files.

## Developer & Operations Commands
- `make all` — Run Ruff format/check, Mypy, TypeScript (`wrangler types && astro sync && tsc --noEmit`), Bandit, pip-audit, npm audit, detect-secrets, and Pytest (98.78% coverage).
- `make sync-vectors` — Ingest `docs/**/*.md`, embed via OS keyring credentials, and upsert vectors into `vraidaten-index`.
- `make deploy` — Build the Astro 7 bundle and deploy to Cloudflare Edge (`vraidaten.com` & `www.vraidaten.com`).
