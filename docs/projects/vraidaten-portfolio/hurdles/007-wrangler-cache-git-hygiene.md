# Hurdle 007: Untracking Wrangler Cache & Blocking Local Edge State

- **Symptom:** Running `git add .` after executing Wrangler CLI commands staged internal `.wrangler/cache` files into the Git repository.
- **Root Cause:** Executing `npx --prefix site wrangler` generates a local `.wrangler/` directory for CLI caching and local Miniflare state. Because `.wrangler/` was only excluded in the system `rclone` filter (`backup-filter.txt`) and not in the repository's `.gitignore`, `git add .` tracked the cache folder.
- **Resolution:**
  1. Verified that Cloudflare OAuth credentials reside safely outside the repository in `~/.config/.wrangler/config/default.toml`.
  2. Purged all `.wrangler/` files from the Git index using `git rm -r --cached`.
  3. Added `.wrangler/`, `**/.wrangler/`, `.dev.vars`, and `**/.dev.vars` to `.gitignore` so local Cloudflare caches, emulation state, and local Worker environment files can never be committed.
