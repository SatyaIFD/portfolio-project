.RECIPEPREFIX = >

GCP_DOCS_SRC ?= ../project-gcp-end2end/docs
GCP_DOCS_DST := docs/projects/gcp-end-to-end

.PHONY: format lint typecheck security test sync-external-docs sync-vectors deploy all

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
> npm --prefix site audit --audit-level=critical
> detect-secrets scan --exclude-files 'site/package-lock.json|uv.lock' > .secrets.baseline

test:
> uv run --isolated pytest

sync-external-docs:
> test -d "$(GCP_DOCS_SRC)" || (echo "ERROR: Missing source directory $(GCP_DOCS_SRC)" >&2 && exit 1)
> mkdir -p "$(GCP_DOCS_DST)"
> rsync -av --delete --exclude='.gitkeep' "$(GCP_DOCS_SRC)/" "$(GCP_DOCS_DST)/"

sync-vectors:
> uv run --isolated python -m rag_pipeline.ingest
> CLOUDFLARE_ACCOUNT_ID="$$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id)" CF_AI_CREDENTIAL="$$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential)" uv run --isolated python -m rag_pipeline.embed
> CLOUDFLARE_ACCOUNT_ID="$$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id)" CLOUDFLARE_API_TOKEN="$$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential)" npx --prefix site wrangler vectorize upsert vraidaten-index --file="$$(pwd)/rag_pipeline/vectorize_vectors.ndjson"

deploy:
> npm --prefix site run build
> CLOUDFLARE_ACCOUNT_ID="$$(secret-tool lookup project vraidaten-portfolio key cloudflare_account_id)" CLOUDFLARE_API_TOKEN="$$(secret-tool lookup project vraidaten-portfolio key cf_ai_credential)" ./site/node_modules/.bin/wrangler deploy --config site/dist/server/wrangler.json

all: format lint typecheck security test
