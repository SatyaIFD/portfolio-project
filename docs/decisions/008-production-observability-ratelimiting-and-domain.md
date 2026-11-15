# ADR 008: Native Workers Observability, Edge Rate Limiting, Serviceability & Deployment

- **Status:** Accepted (Updated 2026-11-15)
- **Date:** 2026-11-15
- **Context:** Production operation on `vraidaten.com` requires real-time visibility into subrequest latencies (`AI.run` vs. `VECTOR_INDEX.query`), automated burst protection, zero-cost health monitoring, and non-interactive edge deployment without violating GDPR prompt/IP privacy constraints.
- **Decision:**
  1. Enable Cloudflare Workers Observability (`observability.logs` and `observability.traces` with `head_sampling_rate: 1`) in `site/wrangler.jsonc` to capture structured JSON telemetry and distributed subrequest traces within the 200,000/day free-tier quota.
  2. Configure the native `ratelimits` binding (`RATE_LIMITER`, `namespace_id: "1001"`, `limit: 10`, `period: 60`) and `VECTOR_TOP_K = "4"` in `site/wrangler.jsonc` to block abusive bursts at the local Cloudflare PoP while retrieving comprehensive context.
  3. Expose a zero-Neuron `GET /api/health` endpoint (`site/src/pages/api/health.ts`) that verifies runtime bindings (`AI`, `VECTOR_INDEX`, `RATE_LIMITER`) and reports active primary/fallback model configuration.
  4. Standardize production deployment via `make deploy` using OS Keyring (`secret-tool`) process-scoped credentials against the compiled `site/dist/server/wrangler.json` bundle, and delegate `vraidaten.com` DNS from Dynadot to Cloudflare nameservers (`edward.ns.cloudflare.com`, `reza.ns.cloudflare.com`) for Custom Domain attachment.
