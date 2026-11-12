# Hurdle 006: Wrangler Environment Variable Deprecation & Vectorize Provisioning

- **Symptoms:**
  1. Running `wrangler vectorize insert` failed with `The index was not found [code: 40040]`.
  2. Wrangler 4.x emitted a deprecation warning: `Using "CF_ACCOUNT_ID" environment variable. This is deprecated. Please use "CLOUDFLARE_ACCOUNT_ID", instead.`
- **Root Causes:**
  1. The interactive OAuth login flow (`npx --prefix site wrangler login`) intercepted the terminal session before the index creation command executed, leaving `vraidaten-index` unprovisioned on Cloudflare. Additionally, `npx --prefix site` shifts the working directory context for relative file arguments.
  2. Exporting `CF_ACCOUNT_ID` in the same shell session as Wrangler triggered Wrangler v4's environment variable deprecation check.
- **Resolutions:**
  1. Explicitly provisioned and verified `vraidaten-index` via `wrangler vectorize create` and `wrangler vectorize list`, and passed an absolute path (`$(pwd)/rag_pipeline/vectorize_vectors.ndjson`) to `wrangler vectorize insert`.
  2. Standardized `rag_pipeline/embed.py` and `tests/test_embed.py` on `CLOUDFLARE_ACCOUNT_ID` so Python and Wrangler share the same non-deprecated environment variable name.
