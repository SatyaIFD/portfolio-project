# System Architecture & External Dependencies

## 1. Topology
1. **Local Ingestion (`rag_pipeline/`):** Validates Markdown files, enforces schema constraints, embeds chunks, and attaches Git commit SHA metadata.
2. **CI/CD Security Gate (`.github/`):** Enforces Ruff, Mypy, Bandit, pip-audit, detect-secrets, Pytest, and Trivy on push. Dependabot actively monitors Python, NPM, and GitHub Actions for zero-day CVEs.
3. **Edge Runtime (`site/`):** Astro static UI hosted on Cloudflare Pages; `/api/chat` Cloudflare Worker connects to Vectorize and Workers AI (`@cf/meta/llama-3.2-1b-instruct` and `@cf/baai/bge-small-en-v1.5`).

## 2. External Dependencies & Integration Points
- **Cloudflare Pages & Workers:** Static hosting and serverless edge execution.
- **Cloudflare Vectorize & Workers AI:** Managed vector index and edge SLM inference.
- **GitHub Actions & Dependabot:** Automated CI/CD, DevSecOps enforcement, and continuous vulnerability patching.
