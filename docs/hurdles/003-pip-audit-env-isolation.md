# Hurdle 003: pip-audit Flagging CVEs in Shared Conda Environment

- **Symptom:** Running `pip-audit` locally reported multiple vulnerabilities across standard packages and failed on local non-PyPI packages from unrelated projects.
- **Root Cause:** Calling `pip-audit` directly invoked the binary inside the shared `mlops-lab` Conda environment rather than an isolated project virtual environment, auditing legacy packages from unrelated projects.
- **Resolution:** Upgraded the vulnerable packages in `mlops-lab`, ran `uv lock --upgrade`, and standardized local checks to use `uv run --isolated` so `pip-audit` audits only the project's locked dependencies.
