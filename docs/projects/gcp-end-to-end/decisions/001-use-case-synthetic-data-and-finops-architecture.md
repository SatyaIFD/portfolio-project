# ADR 001: Claims QA Triage Use Case, Deterministic Synthetic Data & $0/Month GCP FinOps Architecture

- **Status:** Accepted
- **Date:** 2026-11-21
- **Context:** The Google Cloud end-to-end project must reinforce all 6 domains of the Google Cloud Professional Machine Learning Engineer exam, demonstrate production MLOps discipline (Docker, Terraform, IAM, CI/CD, monitoring, drift detection), leverage Satyajit's 9.5 years of operations QA and reconciliation experience, strictly avoid real PII (GDPR/HIPAA), and remain cost-controlled at $0/month steady-state.
- **Decision:**
  1. Build an **Imbalanced Claims & Transaction Exception QA Triage** system (~3–4% positive exception rate) evaluated primarily on **PR-AUC** rather than Accuracy.
  2. Implement a **deterministic, seeded Python synthetic data generator** with non-linear risk rules, overlapping noise, and an explicit `--drift` mode rather than using opaque PCA columns (`V1`–`V28`) or risking real PII exposure.
  3. Build and test the full Python ML pipeline and Dockerized FastAPI service **locally on Ubuntu (`uv` + Docker + GitHub Actions CI)** before activating the 90-day GCP Free Trial credit.
  4. Serve the permanent live API on **Cloud Run (`us-central1`, `min-instances=0`, `max-instances=2`)** paired with GCS, BigQuery/BigQuery ML, Artifact Registry cleanup policies, and Cloud Logging/Monitoring instead of a 24/7 billable Vertex AI Online Endpoint.
- **Consequences:** Eliminates idle cloud bills and real-PII legal risk while enabling live canary rollouts and reproducible drift-detection demonstrations. Trades away real-world legacy data messiness (explicitly disclosed in `known-limitations.md`) and accepts brief scale-to-zero cold starts on Cloud Run.
