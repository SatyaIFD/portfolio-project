# Hurdle 004: Base-Image `pip` Vendored SBOM CVEs Blocking Trivy Container Gate

- **Symptoms:**
  1. Adding Trivy container image scanning (`aquasecurity/trivy-action@v0.36.0`, `HIGH,CRITICAL`, `ignore-unfixed: true`) to `DevSecOps Pipeline` failed PR #14 with 5 fixable `HIGH` Python vulnerabilities (`msgpack 1.1.2`: `CVE-2026-114613` and `GHSA-6v7p-g79w-8964`; `setuptools 70.3.0`: `CVE-2025-47273`; `urllib3 2.7.0`: `CVE-2026-97687` and `CVE-2026-97689`).
  2. None of those three libraries existed in `pyproject.toml`, `uv.lock`, or `/app/.venv`—and Trivy reported zero CVEs across all 87 Debian 13.8 OS packages and every application package in `/app/.venv`.
- **Root Cause:**
  - Inspecting the built container filesystem revealed that the official `python:3.13-slim` base image ships system `pip` (`26.2.2`) alongside an embedded CycloneDX SBOM (`/usr/local/lib/python3.13/site-packages/pip/_vendor/bom.cdx.json`) and a bundled wheel in `/usr/local/lib/python3.13/ensurepip/_bundled/`.
  - Trivy parsed `pip/_vendor/bom.cdx.json` and flagged `pip`'s vendored dependencies even though the runtime container runs strictly from `/app/.venv` (built in Stage 1 via `uv`) and never invokes system `pip` or `ensurepip`.
- **Resolution:**
  1. Hardened Stage 2 (`runtime`) of `Dockerfile` by stripping `/usr/local/lib/python3.13/site-packages/pip*`, `/usr/local/lib/python3.13/ensurepip`, and `/usr/local/bin/pip*` prior to dropping privileges to non-root `uid=10001` (`appuser`).
  2. Verified locally that zero `pip` or `ensurepip` artifacts remain in `/usr/local`, `/health` returns `200`, and `/predict` continues serving verified models with zero runtime impact.
  3. Re-ran GitHub Actions `DevSecOps Pipeline` on PR #14 to confirm zero `HIGH`/`CRITICAL` findings across both filesystem and container image Trivy scans.
