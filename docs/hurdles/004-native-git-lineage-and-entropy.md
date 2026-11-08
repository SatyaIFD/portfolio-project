# Hurdle 004: Native Git Lineage Resolution & Zero-Suppression Security Compliance

- **Symptoms:**
  1. `mypy` failed on `builtins.any` when mocking `subprocess.check_output`.
  2. `ruff` (`S603`/`S607`) and `bandit` (`B404`/`B603`) flagged `subprocess` execution for potential command injection (`CWE-78`), and `ruff format` multi-line wrapping broke inline `# noqa` / `# nosec` comments.
  3. `detect-secrets` blocked commits on `tests/test_ingest.py`, flagging a mixed alphanumeric mock commit string as a `Hex High Entropy String`.
- **Root Causes:**
  1. Spawning an external `git` shell binary via `subprocess` merely to read the current commit SHA introduced an unnecessary OS command-execution surface.
  2. Inline linter suppressions (`# noqa`, `# nosec`, `# pragma`) are brittle when auto-formatters reflow multi-line AST nodes, and they bypass security rules rather than resolving the underlying risk.
  3. Mixed alphanumeric hex strings in unit tests and documentation cross the Shannon entropy threshold used by `detect-secrets`.
- **Resolutions:**
  1. **Security by Design:** Replaced `subprocess` and `shutil` entirely by reading `.git/HEAD` and `.git/refs/` directly with `pathlib.Path`, eliminating the OS command-execution surface and removing the need for `typing.Any` subprocess mocks.
  2. **Clean Test Fixtures:** Standardized test commit SHAs on low-entropy valid hex strings (`"1234567"`), satisfying both the `KnowledgeChunk` regex validation and `detect-secrets` without inline suppression tags.
