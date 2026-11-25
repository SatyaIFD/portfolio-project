# Operational Runbook, Observability & FinOps Controls

## 1. Fresh-Machine Prerequisites & OS Keyring Setup
- **Required Tooling:** Python 3.13 with `uv`, Node.js 22+ with `npm`, `git`, GitHub CLI (`gh`), `rsync`, and `libsecret-tools` (`secret-tool`) for zero-plaintext local credential storage.
- **Bootstrap Dependencies:** Run `uv sync --all-groups` at the repository root and `npm --prefix site ci` inside `site/` to install pinned Python and Astro/Wrangler dependencies.
- **OS Keyring Provisioning (Zero `.env` Secrets):** Store your Cloudflare credentials directly in the local desktop keyring so credentials never touch disk in plaintext:
  - `secret-tool store --label="Cloudflare Account ID" project vraidaten-portfolio key cloudflare_account_id`
  - `secret-tool store --label="Cloudflare AI & Deploy Token" project vraidaten-portfolio key cf_ai_credential`
- **Verify Local Toolchain:** Run `make all` to confirm `ruff`, `mypy`, `tsc`, `bandit`, `pip-audit`, `npm audit`, `detect-secrets`, and `pytest` all pass before making edits.

## 2. Standard Verification, Vector Sync & Deployment Flow
- **Sync External Project Docs (When Upstream Changes):** Run `make sync-external-docs` to mirror `../project-gcp-end2end/docs/` one-way into `docs/projects/gcp-end-to-end/` using `rsync -av --delete`.
- **Pre-PR Validation:** Run `make all && npm --prefix site run build` on a feature branch, open a PR against protected `main`, wait for GitHub Actions `DevSecOps Pipeline` to pass, and squash-merge.
- **Sync Vectorize Knowledge Index:** On updated `main`, run `make sync-vectors` to re-chunk all Markdown files with commit SHA lineage, generate 384-dimensional `@cf/baai/bge-small-en-v1.5` embeddings, and upsert into `vraidaten-index`.
- **Vectorize WAL Propagation Wait:** Always wait at least 12 seconds after `make sync-vectors` before querying `/api/chat` so Cloudflare Vectorize write-ahead log (WAL) indexing completes (see Hurdle 009).
- **Production Deploy & Live Smoke Test:** Run `make deploy`, then verify HTTP `200` on `https://vraidaten.com/`, `https://vraidaten.com/logbook/`, and `https://vraidaten.com/api/health`.

## 3. Rollback & Incident Recovery
- **Instant Worker Version Rollback:** Cloudflare Workers retains immutable version history. List recent deployed versions and roll back to the last known-good version ID without rebuilding:
  - `CLOUDFLARE_ACCOUNT_ID="$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id)" CLOUDFLARE_API_TOKEN="$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential)" ./site/node_modules/.bin/wrangler versions list --config site/dist/server/wrangler.json`
  - `CLOUDFLARE_ACCOUNT_ID="$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id)" CLOUDFLARE_API_TOKEN="$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential)" ./site/node_modules/.bin/wrangler rollback --config site/dist/server/wrangler.json`
- **Vector Index Recovery:** Because all chunks use deterministic IDs tied to Markdown headings and Git commit SHAs, recovering from stale or partial vector writes only requires checking out a known-good `main` commit and re-running `make sync-vectors`.
- **Triaging External 5xx Reports vs. Real Outages:** Automated third-party scrapers can occasionally receive edge 5xx or challenge responses. Always validate live production health directly via `curl -sS https://vraidaten.com/api/health` and inspect Cloudflare Workers real-time logs (`wrangler tail`) before initiating a rollback.

## 4. Observability, Telemetry & Free-Tier FinOps Caps
- **Health & Binding Telemetry (`GET /api/health`):** Returns JSON containing `status`, a unique `request_id`, UTC `timestamp`, live binding flags (`ai`, `vector_index`, `rate_limiter`), and active model/threshold configuration so outages isolate immediately between binding failures and application logic.
- **Structured Pipeline Logging:** Local `rag_pipeline.ingest` and `rag_pipeline.embed` emit single-line JSON telemetry (`timestamp`, `level`, `message`) reporting chunk counts per document and total upserted vectors.
- **Model Failover & Latency Control:** Primary inference runs on `@cf/ibm-granite/granite-4.0-h-micro` for low latency and minimal neuron consumption, automatically failing over to `@cf/google/gemma-4-26b-a4b-it` if the primary model errors or times out.
- **Hard FinOps Guardrails:** Every `/api/chat` request is bounded by Cloudflare's native `RATE_LIMITER` (`10 requests / 60s` per client), `MAX_PROMPT_LENGTH` (`250` characters), `MAX_OUTPUT_TOKENS` (`600` tokens), `VECTOR_TOP_K` (`6` chunks), and a `0.60` cosine similarity floor that refuses out-of-scope queries without burning unnecessary generation tokens.
