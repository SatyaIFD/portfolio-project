# ADR 007: OS Keyring Credential Management & Process-Scoped Injection

- **Status:** Accepted
- **Date:** 2026-11-15
- **Context:** Wrangler browser OAuth tokens expire after a few hours, requiring daily manual re-authentication, whereas storing permanent API tokens in plaintext `.env` files or shell RC files risks credential exposure.
- **Decision:**
  1. Store the Cloudflare Account ID and a scoped Custom API Token (`Workers AI: Edit`, `Vectorize: Edit`, `Workers Scripts: Edit`, without brittle Client IP filtering) in Ubuntu's encrypted GNOME Keyring via `libsecret` (`secret-tool`).
  2. Inject secrets at execution time via process-scoped command prefixes in `Makefile` (`make sync-vectors`) using `secret-tool lookup ... | tr -d '\r\n '` so secrets exist only in child process memory and never touch disk or `.zsh_history`.
