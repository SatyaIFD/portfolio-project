# System Architecture & External Dependencies

## 1. Topology
1. **Local Ingestion (`rag_pipeline/`):** Dynamically discovers Markdown files, enforces schema constraints (`rag_pipeline/schemas.py`), embeds 384-dimensional chunks via `@cf/baai/bge-small-en-v1.5`, and attaches Git commit SHA lineage metadata.
2. **CI/CD Security Gate (`.github/` & `Makefile`):** Enforces Ruff (`PLR2004`), Mypy, TypeScript (`wrangler types && astro sync && tsc --noEmit`), Bandit, pip-audit, npm audit, detect-secrets, Pytest, and Trivy on push. Dependabot actively monitors Python (`uv`), NPM (`/site`), and GitHub Actions for zero-day CVEs.
3. **Edge Runtime (`site/`):** Astro 7 hybrid application deployed on Cloudflare Workers with Static Assets (`@astrojs/cloudflare`); `/api/chat` (`site/src/pages/api/chat.ts`) connects to Vectorize (`vraidaten-index`) and Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8-fast` and `@cf/baai/bge-small-en-v1.5`).

## 2. External Dependencies & Integration Points
- **Cloudflare Workers with Static Assets:** Static asset hosting (`ASSETS`) and serverless edge SSR execution configured via `site/wrangler.jsonc`.
- **Cloudflare Vectorize & Workers AI:** Managed 384-dimension cosine vector index (`vraidaten-index`) and quantized FP8-fast edge inference.
- **GitHub Actions & Dependabot:** Automated CI/CD, DevSecOps enforcement, and continuous vulnerability patching.
