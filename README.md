# VraiDaten (vraidaten.com) — Edge RAG Portfolio

Zero-cost, GDPR and EU AI Act compliant MLOps engineering portfolio powered by Astro, Cloudflare Pages, Cloudflare Workers AI, and Vectorize.

## Documentation Index
- [Requirements & Schemas](docs/requirements.md)
- [System Architecture](docs/architecture.md)
- [Engineering Decisions (ADRs)](docs/decisions/001-edge-rag-slm.md)
- [Known Limitations](docs/known-limitations.md)
- [Engineering Hurdles Log](docs/hurdles/)

## Developer Workflows

A `Makefile` is provided to standardize local DevSecOps tasks:
- `make format`: Auto-formats code and applies safe linting fixes.
- `make lint`: Checks for styling and AST errors.
- `make typecheck`: Runs strict static typing.
- `make security`: Runs Bandit, pip-audit, and detect-secrets.
- `make test`: Runs the pytest suite and coverage.
- `make all`: Runs the entire pipeline sequentially.
