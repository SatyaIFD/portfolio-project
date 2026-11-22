# Operational Runbook & FinOps Guardrails

## 1. Day-0 Billing & Cost Protection Checklist
- **Region Lock:** Provision all storage, BigQuery datasets, Artifact Registry repos, and Cloud Run services exclusively in `us-central1` to remain inside US Always Free tiers and eliminate cross-region egress charges.
- **Budget Alerts:** Create GCP Billing Budget alerts at $1, $5, and $15 routed to email before deploying any cloud infrastructure.
- **Storage & Compute Caps:** Enforce Cloud Storage 30-day object lifecycle deletion on staging prefixes, Artifact Registry cleanup policy keeping only the latest 2 tags (under 0.5 GB total), and Cloud Run `min-instances=0` / `max-instances=2`.
- **No Idle Paid Endpoints:** Never leave a 24/7 Vertex AI Online Prediction Endpoint deployed. Any Vertex AI custom training or batch prediction experiments are executed ephemerally and cleaned up immediately.

## 2. Incident Triage Playbook
- **5xx Spike or Failed Canary Revision:** Inspect structured JSON logs in Cloud Logging filtered by `severity>=ERROR`, route 100% traffic immediately back to the previous stable Cloud Run revision, and document the root cause in `docs/hurdles/`.
- **Feature Drift Alert (PSI >= 0.20):** Review the BigQuery drift summary table to identify shifted features, verify upstream schema changes, retrain on validated recent data, and validate against the PR-AUC promotion gate before canary rollout.

## 3. Clean Teardown Procedure
- Execute `terraform destroy` from `terraform/` to cleanly remove Cloud Run services, Artifact Registry images, BigQuery datasets, and Cloud Storage buckets with zero orphaned billable resources.
