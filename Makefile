.RECIPEPREFIX = >

.PHONY: format lint typecheck security test all

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

all: format lint typecheck security test
