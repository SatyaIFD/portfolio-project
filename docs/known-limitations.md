# Known Limitations & Outstanding Issues

1. **Free-Tier Quota Ceiling:** Cloudflare Workers AI free tier caps at 10,000 Neurons/day; extreme traffic spikes will trigger rate limiting.
2. **Short Query Ambiguity:** Single-word user queries may yield lower cosine similarity scores against multi-sentence Markdown chunks.
3. **Pre-Launch Status:** Live domain (`vraidaten.com`) and production Vectorize bindings remain paused until completion of the GCP Professional ML Engineer certification and flagship GCP project.
