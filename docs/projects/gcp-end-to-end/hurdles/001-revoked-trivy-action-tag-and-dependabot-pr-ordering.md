# Hurdle 001: Revoked `trivy-action` Tag (`0.30.0`) & Dependabot PR Ordering

- **Symptoms:**
  1. The initial `DevSecOps Pipeline` run on `main` failed in 4 seconds with `Unable to resolve action aquasecurity/trivy-action@0.30.0, unable to find version 0.30.0`.
  2. Dependabot immediately opened three GitHub Actions update PRs (`actions/checkout`, `astral-sh/setup-uv`, and `aquasecurity/trivy-action`), where PR #3 passed in 33 seconds while PR #1 and PR #2 failed in 6 seconds with the same missing-tag error.
- **Root Cause:**
  - Upstream security advisories affected `aquasecurity/trivy-action` versions older than `0.35.0`, and the legacy `0.30.0` tag was removed from GitHub.
  - Because `main` still pinned `0.30.0`, every parallel Dependabot PR that did not update `trivy-action` inherited the broken workflow reference.
- **Resolution:**
  1. Audited the diff and passing CI status of Dependabot PR #3 (upgrading `aquasecurity/trivy-action` to patched release `0.36.0`) and merged it into `main` first.
  2. Triggered `@dependabot rebase` on PR #1 and PR #2 so both replayed onto the patched workflow and re-ran `DevSecOps Pipeline` cleanly.
  3. Reinforced a Day-0 CI hygiene rule: verify the actual `DevSecOps Pipeline` workflow run explicitly via `--workflow` filter rather than assuming the latest run (`gh run list --limit 1`, which captured Dependabot's updater job) represents a passing build.
