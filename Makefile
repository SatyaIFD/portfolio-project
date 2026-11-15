.RECIPEPREFIX = >

.PHONY: format lint typecheck security test sync-vectors all

format:
> uv run --isolated ruff format .
> uv run --isolated ruff check --fix .

lint:
> uv run --isolated ruff check .

typecheck:
> uv run --isolated mypy rag_pipeline tests
> npm --prefix site run typecheck

security:
> uv run --isolated bandit -c pyproject.toml -r rag_pipeline
> uv run --isolated pip-audit
> npm --prefix site audit --audit-level=moderate
> detect-secrets scan --exclude-files 'site/package-lock.json|uv.lock' > .secrets.baseline

test:
> uv run --isolated pytest

sync-vectors:
> uv run --isolated python -m rag_pipeline.ingest
> CLOUDFLARE_ACCOUNT_ID="$$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id | tr -d '\r\n ')" \
  CF_AI_CREDENTIAL="$$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential \vert{} tr -d '\r\n ')" \ uv run --isolated python -m rag_pipeline.embed > CLOUDFLARE_ACCOUNT_ID="$$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id | tr -d '\r\n ')" \
  CLOUDFLARE_API_TOKEN="$$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential \vert{} tr -d '\r\n ')" \ npx --prefix site wrangler vectorize upsert vraidaten-index --file="$$(pwd)/rag_pipeline/vectorize_vectors.ndjson"

all: format lint typecheck security test
