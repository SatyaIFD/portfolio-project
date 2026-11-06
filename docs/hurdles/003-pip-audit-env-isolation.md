# Hurdle 003: pip-audit Flagging 90 CVEs in Shared Conda Environment

- **Symptom:** Running `pip-audit` locally reported 90 vulnerabilities across 13 packages (`pillow`, `aiohttp`, `filelock`, `virtualenv`, etc.) and failed on local non-PyPI packages (`day25-end-to-end-mlops`, `employee-api`).
- **Root Cause:** Calling `pip-audit` directly invoked the binary inside the shared `mlops-lab` Conda environment rather than an isolated project virtual environment, auditing legacy packages from unrelated projects.
- **Resolution:** Upgraded the 13 vulnerable packages in `mlops-lab`, ran `uv lock --upgrade`, and standardized local checks to use `uv run --isolated` so `pip-audit` audits only the project's locked dependencies.
