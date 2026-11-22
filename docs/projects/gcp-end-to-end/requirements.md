# Requirements & Engineering Specifications

## 1. Functional Requirements
- **Problem Statement:** Score incoming anonymized claims and financial transaction records to flag rare operational exceptions (3–4% base rate) for priority Quality Assurance (QA) review before Turnaround Time (TAT) SLA breaches.
- **Deterministic Data Generation:** Provide a seeded Python CLI that produces reproducible training, validation, and drift-injected evaluation batches with zero external PII dependencies.
- **Low-Code Baseline vs. Custom Model Gate:** Train a BigQuery ML Logistic Regression baseline and a custom Python tree-based classifier (scikit-learn / XGBoost). Automated CI/CT checks must reject model promotion if the custom model fails to outperform the baseline on PR-AUC.
- **Online Triage API:** Serve a containerized FastAPI endpoint (`POST /predict` and `GET /health`) returning an exception probability score, calibrated triage bucket (`AUTO_PROCESS`, `STANDARD_QA`, `PRIORITY_ESCALATION`), and model version metadata.
- **Automated Drift Monitoring:** Execute a scheduled batch job comparing recent serving feature distributions against training baselines using Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) tests.

## 2. Statistical & ML Evaluation Requirements
- **Primary Metric:** Precision-Recall Area Under the Curve (PR-AUC), chosen over raw Accuracy because 96–97% negative-class dominance makes Accuracy misleading.
- **Decision Threshold Calibration:** Tune operational thresholds explicitly against recall targets for high-severity exceptions and QA review capacity limits.
- **Leakage Prevention:** Enforce strict train/validation/test splitting before fitting scalers, encoders, or imputation transformers inside a single serialized pipeline.

## 3. FinOps & Cost-Control Requirements
- **Steady-State Budget:** Operate at **$0/month** inside Google Cloud Always Free Tier limits after setup, co-located strictly in `us-central1`.
- **Hard Spend Guardrails:** Configure GCP Billing Budget alerts ($1, $5, $15) before enabling paid APIs, enforce `min-instances=0` and `max-instances=2` on Cloud Run, enforce `maximum_bytes_billed` on BigQuery queries, and attach lifecycle cleanup rules on Cloud Storage (30 days) and Artifact Registry (keep latest 2 images).
- **Local-First Trial Discipline:** Complete local Python pipeline, unit tests, and Docker verification before activating the 90-day GCP Free Trial credit.

## 4. Security, Quality & Documentation Requirements
- **DevSecOps CI Gate:** Require passing `ruff`, `mypy`, `bandit`, `pip-audit`, `detect-secrets`, `pytest` (`>=80%` coverage), and Trivy scans on every pull request into protected `main`.
- **Single Source of Truth Documentation:** Maintain Specs, Threat Model, Data Governance, FinOps Runbook, ADRs, and Operational Hurdles in `docs/`, mirrored one-way into `vraidaten.com`.
