# Hurdle 002: GitHub Actions UV Cache Missing Lockfile

- **Symptom:** `setup-uv@v3` failed with `No file matched to [**/uv.lock]`.
- **Root Cause:** `enable-cache: true` requires a committed `uv.lock` file in the repository root.
- **Resolution:** Generated `uv.lock` via `uv lock` and committed it to version control.
