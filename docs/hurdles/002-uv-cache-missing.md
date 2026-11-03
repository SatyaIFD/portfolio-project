# Hurdle 002: GitHub Actions UV Cache Missing Lockfile

**Symptom:** `setup-uv@v3` action failed with `Error: No file matched to [**/uv.lock]`.
**Root Cause:** The action had `enable-cache: true` but the repository had no `uv.lock` file because dependencies were only installed globally via `uv pip` locally.
**Resolution:** Ran `uv lock` to generate the `uv.lock` file from `pyproject.toml` so the CI cache has a valid target file to hash.
