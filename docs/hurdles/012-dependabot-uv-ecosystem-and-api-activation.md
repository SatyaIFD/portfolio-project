# Hurdle 012: Dependabot API Activation, uv Ecosystem Parity & Workflow Token Scoping

- **Symptoms:**
  1. Querying `repos/SatyaIFD/portfolio-project/vulnerability-alerts` returned `404 Not Found` (disabled) and `automated-security-fixes` returned `"enabled": false`, despite `docs/architecture.md` stating Dependabot actively monitors zero-day CVEs.
  2. `.github/dependabot.yml` specified `package-ecosystem: "pip"` instead of `"uv"`, which does not natively maintain `uv.lock` integrity.
  3. `.github/workflows/ci-secops.yml` relied on repository-default `GITHUB_TOKEN` permissions rather than declaring explicit workflow-level least privilege.
- **Root Causes:**
  1. Committing `.github/dependabot.yml` enables version-update scheduling, but GitHub requires separate repository API flags (`vulnerability-alerts` and `automated-security-fixes`) to activate CVE scanning and automated security PRs.
  2. `.github/dependabot.yml` was initialized with `"pip"` before the pipeline standardized on `uv` lockfiles.
- **Resolutions:**
  1. Enabled both `vulnerability-alerts` and `automated-security-fixes` via `gh api --method PUT`.
  2. Updated `.github/dependabot.yml` from `package-ecosystem: "pip"` to `package-ecosystem: "uv"`.
  3. Added explicit `permissions: contents: read` to `.github/workflows/ci-secops.yml` to enforce least-privilege `github-actions[bot]` execution in code.
