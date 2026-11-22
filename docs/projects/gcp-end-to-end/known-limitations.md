# Known Limitations & Operational Boundaries

## 1. Synthetic Data Ceiling
- Although the generator incorporates non-linear interactions, class imbalance, and controlled noise, synthetic distributions cannot fully replicate every edge case of enterprise legacy billing or pension systems. All metrics are documented honestly as synthetic-benchmark validations of the MLOps pipeline.

## 2. Cloud Run Scale-to-Zero Cold Starts
- Enforcing `min-instances=0` guarantees **$0/month** idle billing, but the first request after an idle period experiences a brief container cold-start latency (typically 1–3 seconds while loading the serialized model into memory).

## 3. Ephemeral vs. Always-On Vertex AI Serving
- Vertex AI Online Prediction Endpoints charge hourly node fees even with zero traffic. This architecture uses Cloud Run for permanent zero-cost serving and reserves Vertex AI for BigQuery ML Model Registry integration and short-lived batch/training experiments.

## 4. Single-Region Non-HA Topology
- All resources are pinned to `us-central1` for Always Free Tier compliance and zero egress fees; multi-region active-active failover is intentionally out of scope.
