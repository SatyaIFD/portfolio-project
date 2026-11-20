# Hurdle 012: Dependabot API Activation, uv Ecosystem Parity & NPM Audit Gate

- **Symptoms:**
  1. Querying `repos/SatyaIFD/portfolio-project/vulnerability-alerts` returned `404 Not Found` (disabled) and `automated-security-fixes` returned `"enabled": false`, hiding a moderate vulnerability in `astro` (`7.4.5`).
  2. `.github/dependabot.yml` specified `package-ecosystem: "pip"` instead of `"uv"`, and `Makefile` only ran `pip-audit` without `npm audit`.
  3. `.github/workflows/ci-secops.yml` relied on repository-default `GITHUB_TOKEN` permissions rather than declaring explicit workflow-level least privilege.
- **Root Causes:**
  1. Committing `.github/dependabot.yml` enables version-update scheduling, but GitHub requires separate repository API flags (`vulnerability-alerts` and `automated-security-fixes`) to activate CVE scanning and automated security PRs.
  2. `.github/dependabot.yml` was initialized with `"pip"` before the pipeline standardized on `uv` lockfiles, and `npm --prefix site audit` was not wired into `make security`.
- **Resolutions:**
  1. Enabled both `vulnerability-alerts` and `automated-security-fixes` via `gh api --method PUT`, allowing Dependabot to automatically patch `astro` from `7.4.5` to `7.4.12` (closing Alert #1).
  2. Updated `.github/dependabot.yml` to `package-ecosystem: "uv"` and added `npm --prefix site audit --audit-level=moderate` to `Makefile` and `.github/workflows/ci-secops.yml`.
  3. Added explicit `permissions: contents: read` to `.github/workflows/ci-secops.yml` to enforce least-privilege `github-actions[bot]` execution in code.
