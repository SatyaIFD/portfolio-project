# Hurdle 011: TypeScript Static Type-Checking Gate & Pre-Commit Hook Execution

- **Symptoms:**
  1. Committing changes that only modified `.ts`, `.jsonc`, or `.md` files caused `pre-commit` to print `(no files to check)Skipped` for `ruff`, `ruff-format`, and `bandit`.
  2. Neither `make typecheck` nor `.github/workflows/ci-secops.yml` validated TypeScript types in `site/src/pages/api/chat.ts`, and `tsc` / `@types/node` were missing from `site/package.json`.
- **Root Causes:**
  1. In `.pre-commit-config.yaml`, hooks with default `types: [python]` are skipped when no `.py` files are staged unless `always_run: true` and `pass_filenames: false` are explicitly configured.
  2. `typescript` and `@types/node` were not installed in `site/` devDependencies, and `Makefile` / `ci-secops.yml` only executed Python `mypy`.
- **Resolutions:**
  1. Installed `typescript` and `@types/node` in `site/` and added `"typecheck": "wrangler types && astro sync && tsc --noEmit"` to `site/package.json`.
  2. Integrated `npm --prefix site run typecheck` into `Makefile` (`typecheck`) and `.github/workflows/ci-secops.yml`.
  3. Added `always_run: true` and `pass_filenames: false` to `ruff`, `ruff-format`, and `bandit` in `.pre-commit-config.yaml`.
