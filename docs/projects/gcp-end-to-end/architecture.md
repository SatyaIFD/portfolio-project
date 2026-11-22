# System Architecture & Cloud Topology

## 1. End-to-End Pipeline Topology
- **Local Development & CI (`src/claims_triage/`, `tests/`, `.github/workflows/`):** Python 3.13 managed via Astral `uv`. All data validation, unit testing, model training logic, and Docker builds are verified locally and via GitHub Actions before touching Google Cloud.
- **Data Lake & Warehouse (`us-central1`):** Batch CSV/Parquet uploads land in a lifecycle-managed Cloud Storage bucket and load free-of-charge into partitioned BigQuery tables.
- **Low-Code Baseline (`BigQuery ML`):** Trains an initial `LOGISTIC_REG` model directly in SQL for reproducible benchmarking and optional Vertex AI Model Registry registration.
- **Custom Training & Container Packaging (`Docker` + `Artifact Registry`):** Multi-stage slim Python container packaging the validated inference API and versioned model artifact, kept under 250 MB to stay within Artifact Registry's 0.5 GB free tier.
- **Scale-to-Zero Serving (`Cloud Run`):** Serves `POST /predict` and `GET /health` with `min-instances=0`, `max-instances=2`, and native 90/10 canary revision traffic splitting.
- **Observability & Skew Detection (`Cloud Logging`, `Cloud Monitoring`, `Cloud Run Jobs`):** Structured JSON prediction telemetry feeds Cloud Logging and a scheduled Cloud Run Job that writes weekly PSI/KS drift reports into BigQuery.

## 2. Least-Privilege IAM Identity Map
- **GitHub Actions CI/CD Identity (Keyless WIF):** Authenticates via OIDC Workload Identity Federation; granted strictly scoped permissions to push images to Artifact Registry and deploy Cloud Run revisions.
- **Cloud Run Serving Service Account:** Read-only access to required model artifacts and log-writing permissions (`roles/logging.logWriter`); zero bucket-delete or BigQuery-admin privileges.
- **Drift Monitor Job Service Account:** Scoped strictly to read serving logs/tables and append drift metrics into the dedicated BigQuery monitoring dataset.

## 3. Infrastructure as Code (`terraform/`)
- All GCP resources (Cloud Storage bucket + lifecycle rules, BigQuery datasets, Artifact Registry cleanup policies, IAM service accounts, and Cloud Run services) are declared in Terraform so the full stack is reproducible and tear-down safe via `terraform destroy`.
