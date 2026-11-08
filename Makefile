.RECIPEPREFIX = >

.PHONY: format lint typecheck security test all

format:
> uv run --isolated ruff format .
> uv run --isolated ruff check --fix .

lint:
> uv run --isolated ruff check .

typecheck:
> uv run --isolated mypy rag_pipeline tests

security:
> uv run --isolated bandit -c pyproject.toml -r rag_pipeline
> uv run --isolated pip-audit
> detect-secrets scan --exclude-files 'site/package-lock.json|uv.lock' > .secrets.baseline

test:
> uv run --isolated pytest

all: format lint typecheck security test
