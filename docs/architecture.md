# System Architecture & External Dependencies

## 1. Topology
1. **Local Ingestion (`rag_pipeline/` & `make sync-vectors`):** Dynamically discovers Markdown files, merges standalone headings into body paragraphs (`merge_heading_blocks`), enforces schema constraints (`rag_pipeline/schemas.py`), and injects credentials from Ubuntu's encrypted OS Keyring (`secret-tool`) to embed 384-dimensional chunks via `@cf/baai/bge-small-en-v1.5` with Git commit SHA lineage metadata.
2. **CI/CD Security Gate (`.github/` & `Makefile`):** Enforces Ruff (`PLR2004`), Mypy, TypeScript (`wrangler types && astro sync && tsc --noEmit`), Bandit, pip-audit, npm audit, detect-secrets, Pytest, and Trivy on push. Dependabot actively monitors Python (`uv`), NPM (`/site`), and GitHub Actions for zero-day CVEs.
3. **Edge Runtime (`site/`):** Astro 7 hybrid application deployed on Cloudflare Workers with Static Assets (`@astrojs/cloudflare`); `/api/chat` (`site/src/pages/api/chat.ts`) connects to Vectorize (`vraidaten-index`), native edge rate limiting (`RATE_LIMITER`), and Workers AI with Primary (`@cf/ibm-granite/granite-4.0-h-micro`) + Automatic Fallback (`@cf/google/gemma-4-26b-a4b-it`) model routing, while `/api/health` provides zero-Neuron serviceability checks.

## 2. External Dependencies & Integration Points
- **Cloudflare Workers with Static Assets & Observability:** Static asset hosting (`ASSETS`), serverless edge SSR execution, native rate limiting (`ratelimits`), and 100% sampled structured Logs & Traces (`observability`) configured via `site/wrangler.jsonc`.
- **Cloudflare Vectorize & Workers AI:** Managed 384-dimension cosine vector index (`vraidaten-index`) and resilient Primary/Fallback LLM inference.
- **GitHub Actions & Dependabot:** Automated CI/CD, DevSecOps enforcement, and continuous vulnerability patching.
