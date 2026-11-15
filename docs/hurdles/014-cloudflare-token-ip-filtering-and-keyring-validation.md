# Hurdle 014: Cloudflare API Token IP Filtering (9109), Keyring Hygiene (6111) & Makefile Recipe Escaping

- **Symptoms:**
  1. Running `wrangler vectorize delete-vectors` and `rag_pipeline.embed` with a custom Cloudflare API token failed with `Authentication error [code: 10000]` and `Cannot use the access token from location: ... [code: 9109]`.
  2. Pasting a multi-line command block containing `secret-tool store` caused the keyring to store a 32-character value, which Cloudflare `/user/tokens/verify` rejected with `Invalid format for Authorization header [code: 6111]`.
  3. Running `npm --prefix site run typecheck` failed with `InvalidEscapeCharacter` on `"\$schema"` in `site/wrangler.jsonc`.
  4. Running `make sync-vectors` failed with `Unknown option -d` from `secret-tool` and `/bin/sh: 1:  uv: not found`.
- **Root Causes:**
  1. Attaching Client IP Address Filtering to a Cloudflare API token breaks CLI workflows whenever an ISP rotates dynamic IPv4 addresses or a VPN split-tunnel routes traffic through a different egress IP.
  2. Running `secret-tool store` inside a multi-line clipboard paste causes standard input (`Password:`) to consume subsequent lines or stale clipboard content instead of the intended token string.
  3. Zsh paste sanitization can prefix `$` with a backslash (`\$`) and convert pipe characters into `\vert{}` when pasting multi-line heredoc blocks.
  4. Using backslash line continuations (`\`) inside a `Makefile` configured with `.RECIPEPREFIX` caused `/bin/sh` to interpret the next recipe prefix as output redirection and treat `\ uv` as a command starting with a literal space character.
- **Resolutions:**
  1. Removed Client IP Address Filtering from the scoped Cloudflare Custom API Token, relying on least-privilege resource scopes (`Workers AI`, `Vectorize`, `Workers Scripts`) and encrypted OS Keyring storage.
  2. Executed `secret-tool store` as an isolated single-line command and verified active token status against `https://api.cloudflare.com/client/v4/user/tokens/verify`.
  3. Stripped stray `\$` and `\vert{}` sequences via Python and wrote each `sync-vectors` recipe step in `Makefile` as a single self-contained line relying on POSIX command substitution `$$(secret-tool lookup ...)` to strip trailing newlines natively.
