# Security Architecture & Threat Model

## 1. Security Posture & Zero-Trust Boundaries
- **Credential Hygiene:** Zero service-account JSON keys, zero `.env` files in Git, and mandatory `detect-secrets` pre-commit + CI scanning. Cloud deployments authenticate exclusively via keyless GitHub OIDC Workload Identity Federation (WIF).
- **Branch Protection:** `main` enforces pull requests, passing CI security checks, and blocks force pushes or branch deletion.
- **Minimal GitHub Token Scope:** GitHub Actions workflows explicitly declare `permissions: contents: read` at the workflow level.

## 2. Threat Model & Mitigations
- **Threat 1 — Cloud Credential Leakage:** Mitigated by banning static GCP JSON keys, using WIF for CI/CD, using short-lived ADC locally, and blocking secret patterns via `detect-secrets` and `.gitignore`.
- **Threat 2 — Malformed Payloads & Schema Abuse on `/predict`:** Mitigated by strict Pydantic input validation (bounded numeric ranges, allowed categorical enums, payload size limits) rejecting invalid inputs with `HTTP 422` before model inference.
- **Threat 3 — Billing Denial-of-Wallet (DoS) Attack:** Mitigated by Cloud Run `max-instances=2`, per-request timeouts, BigQuery `maximum_bytes_billed` caps, and automated GCP Billing Budget alerts starting at $1.
- **Threat 4 — Vulnerable Python or Container Dependencies:** Mitigated by pinned `uv.lock`, automated Dependabot alerts/PRs, `pip-audit`, Bandit static analysis, non-root slim Docker containers, and Trivy vulnerability scans in CI.
- **Threat 5 — Accidental PII Ingestion:** Mitigated by generating 100% synthetic tabular features with no names, emails, SSNs, policy IDs, or real medical/pension records, reinforced by automated schema checks.
