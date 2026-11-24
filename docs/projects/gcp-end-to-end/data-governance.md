# Data Governance & Synthetic Dataset Card

## 1. Purpose & Privacy Compliance
- Real financial, pension (GDPR), and healthcare (HIPAA) operational records cannot be used in public portfolios.
- This project uses a **deterministic, seeded Python data generator** that simulates anonymized operational claims and transactions with **zero real PII**.

## 2. Feature Schema & Business Alignment
- **Numeric Operational Signals:** `claim_amount`, `processing_age_hours`, `reconciliation_variance`, `prior_qa_flags`, `document_count`.
- **Categorical & Boolean Signals:** `submission_channel` (portal, batch_file, manual_email, api), `auth_doc_verified` (boolean), `domain_type` (pension_contribution, pension_transfer, healthcare_claim).
- **Target Label:** `is_exception` (binary, ~2–4% baseline positive exception rate; `1.93%` on the default 10,000-row `seed=42` training batch, rising to `7.90%` under `--drift` covariate shift).

## 3. Realism Safeguards (Avoiding Toy Accuracy)
- **Non-Linear Risk Patterns:** Exceptions depend on decisive multi-factor operational combinations (such as reconciliation variance paired with missing authorization verification, aged manual-email claims, or high-value claims with prior QA flags), rather than a single trivial threshold.
- **Controlled Overlapping Noise:** Latent Gaussian logit noise paired with calibrated `0.1%` stochastic label noise (reduced from `1.0%` after Hurdle 003 proved symmetric `1%` flipping flooded a rare ~2% positive class) produces realistic class overlap—yielding grounded imbalanced metrics (~`0.17` linear baseline CV PR-AUC vs. ~`0.33` tree candidate CV PR-AUC, ~`0.35` holdout PR-AUC, and ~`0.89` ROC-AUC) rather than artificial `1.00` scores.
- **Reproducible Drift Injection (`--drift`):** Supports generating shifted post-deployment batches (covariate shift in amounts, verification drop-offs, and processing delays while holding underlying risk weights fixed) to validate automated PSI/KS drift alerts end-to-end.
