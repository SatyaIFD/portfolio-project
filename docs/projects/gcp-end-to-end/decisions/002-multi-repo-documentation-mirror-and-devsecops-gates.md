# ADR 002: Dedicated Repository Isolation, One-Way Portfolio Docs Mirror & Hardened DevSecOps Gates

- **Status:** Accepted
- **Date:** 2026-11-21
- **Context:** Mixing Python ML libraries (`scikit-learn`, `xgboost`, `fastapi`), Dockerfiles, and Terraform modules inside `portfolio-project` would bloat the Astro/Cloudflare website CI pipeline. Conversely, maintaining manual copies of documentation in two repositories breaks Single Source of Truth and creates drift.
- **Decision:**
  1. Host all GCP application code, Terraform IaC, Dockerfiles, tests, and canonical documentation inside a dedicated public repository (`SatyaIFD/project-gcp-end2end`).
  2. Treat `project-gcp-end2end/docs/` as the sole editable source of truth and mirror it one-way into `portfolio-project/docs/projects/gcp-end-to-end/` via a deterministic `Makefile` target (`make sync-external-docs`) so `vraidaten.com/logbook` and `vraidaten-index` stay synchronized automatically.
  3. Enforce strict Day-0 DevSecOps gates across local pre-commit hooks and GitHub Actions CI (`ruff`, `mypy`, `bandit`, `pip-audit`, `detect-secrets`, `pytest >=80%`, Trivy) with minimal `GITHUB_TOKEN` permissions (`contents: read`) and keyless WIF for future GCP deployments.
- **Consequences:** Clean separation of concerns between website delivery and ML pipeline CI, zero documentation drift, and production-grade supply-chain hygiene from commit #1.
