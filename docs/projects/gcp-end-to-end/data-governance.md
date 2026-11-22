# Data Governance & Synthetic Dataset Card

## 1. Purpose & Privacy Compliance
- Real financial, pension (GDPR), and healthcare (HIPAA) operational records cannot be used in public portfolios.
- This project uses a **deterministic, seeded Python data generator** that simulates anonymized operational claims and transactions with **zero real PII**.

## 2. Feature Schema & Business Alignment
- **Numeric Operational Signals:** `claim_amount`, `processing_age_hours`, `reconciliation_variance`, `prior_qa_flags`, `document_count`.
- **Categorical & Boolean Signals:** `submission_channel` (portal, batch_file, manual_email, api), `auth_doc_verified` (boolean), `domain_type` (pension_contribution, pension_transfer, healthcare_claim).
- **Target Label:** `is_exception` (binary, ~3–4% positive exception rate requiring manual QA intervention).

## 3. Realism Safeguards (Avoiding Toy Accuracy)
- **Non-Linear Risk Patterns:** Exceptions depend on realistic combinations (such as high variance paired with missing authorization verification or delayed batch submissions), not a single trivial threshold.
- **Controlled Overlapping Noise:** Deliberate Gaussian feature noise and ~1–2% stochastic label noise ensure realistic class overlap so models achieve grounded PR-AUC scores (~0.72–0.78 baseline, ~0.83–0.88 tuned) rather than artificial 1.00 metrics.
- **Reproducible Drift Injection (`--drift`):** Supports generating shifted post-deployment batches (covariate shift in amounts, verification drop-offs, and processing delays) to validate automated PSI/KS drift alerts end-to-end.
