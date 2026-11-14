# Hurdle 010: Astro 7 Cloudflare Workers Assets Migration & API Endpoint Routing

- **Symptoms:**
  1. Running `npm --prefix site run build` failed during prerendering with `The name 'ASSETS' is reserved in Pages projects. Please use a different name for your Assets binding.`
  2. The `site/functions/api/chat.ts` file was completely omitted from `site/dist/`.
  3. `@astrojs/cloudflare` automatically injected unused `SESSION` KV and `IMAGES` bindings during build initialization.
  4. Setting `compatibility_date` to `"2026-11-13"` caused Miniflare prerendering to fail because the bundled `workerd` binary supports up to `"2026-11-08"`.
- **Root Causes:**
  1. `@astrojs/cloudflare` v14 (Astro 7) removed legacy Cloudflare Pages support (`pages_build_output_dir`) in favor of Cloudflare Workers with Static Assets (`"main": "@astrojs/cloudflare/entrypoints/server"` and `"assets": { "binding": "ASSETS", "directory": "./dist" }`).
  2. Under `@astrojs/cloudflare`, server API endpoints must reside in `site/src/pages/api/` with `export const prerender = false` and access bindings via `import { env } from "cloudflare:workers"`.
  3. Astro 7 enables KV-backed sessions and runtime Cloudflare Images bindings by default unless disabled in `site/astro.config.mjs`.
  4. Local `workerd` binaries inside `miniflare` enforce a strict maximum supported compatibility date (`2026-11-08`).
- **Resolutions:**
  1. Replaced `pages_build_output_dir` in `site/wrangler.jsonc` with `main` and `assets` (`directory: "./dist"`, `binding: "ASSETS"`), and pinned `compatibility_date` to `"2026-11-08"`.
  2. Migrated the hardened endpoint to `site/src/pages/api/chat.ts` (`export const prerender = false`) and removed the legacy `site/functions/` directory.
  3. Set `session: false` and `imageService: "compile"` in `site/astro.config.mjs` to eliminate unneeded KV and Images runtime bindings.
