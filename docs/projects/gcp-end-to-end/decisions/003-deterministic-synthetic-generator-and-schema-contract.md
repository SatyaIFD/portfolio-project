# ADR 003: Strict Zero-PII Schema Contract, Seeded Covariate-Shift Generator & Stdlib CSV Serialization

- **Status:** Accepted
- **Date:** 2026-11-22
- **Context:** Phase 1 requires a reproducible, zero-PII dataset generator for imbalanced claims and financial transaction QA triage (~3–4% exception rate) that avoids artificial 1.00 toy accuracy, supports measurable post-deployment covariate shift for Phase 4 drift tests, and shares an identical input contract with Phase 3 FastAPI serving.
- **Decision:**
  1. Enforce a strict Pydantic v2 `ClaimRecord` contract (`src/claims_triage/schemas.py`) using `ConfigDict(extra="forbid")`, bounded numeric ranges, and `Literal` category enums so unexpected PII columns (such as `customer_email` or `ssn`) and CSV formula-injection strings fail immediately at validation time.
  2. Isolate randomness inside `numpy.random.default_rng(seed)` (never mutating global NumPy state), combining non-linear feature interactions, latent Gaussian noise, and stochastic QA label noise inside `src/claims_triage/generate.py`.
  3. Implement `--drift` as pure covariate shift (shifting `claim_amount`, `processing_age_hours`, and `auth_doc_verified` distributions while holding the underlying risk weights constant) so Phase 4 PSI/KS monitoring validates real distribution drift.
  4. Use Python standard-library `csv.DictWriter`, `argparse`, and single-line JSON `logging` (formatted via `%(message)s` for Google Cloud Logging `jsonPayload` ingestion) instead of pulling heavy `pandas` dependencies into the data-generation package.
- **Consequences:** Achieves 100% deterministic unit-test coverage (`pytest` + strict `mypy` + `bandit` + `pip-audit`), keeps the base package lightweight for slim non-root Docker builds, and enforces strict schema parity from synthetic ingestion through online inference.
