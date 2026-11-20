# Hurdle 018: Cloudflare workerd Prerender Filesystem Isolation (0 Logbook Entries) & Vite import.meta.glob Fix

- **Symptoms:**
  1. Although `docs/decisions/` contained 11 ADRs and `docs/hurdles/` contained 17 Hurdle files, the live `/logbook` page on `https://vraidaten.com/logbook` rendered `Architectural Decision Records (0)` and `Operational Hurdles & Root-Cause Logs (0)`.
- **Root Causes:**
  1. `site/src/pages/logbook.astro` used Node.js `fs.existsSync(path.resolve(process.cwd(), "../docs/decisions"))` and `fs.readdirSync(...)`.
  2. In Astro 7 with `@astrojs/cloudflare`, static route prerendering executes inside a local `workerd` (Cloudflare Workers V8 isolate) runtime (`Establishing remote connection... prerendering static routes`). Inside the `workerd` sandbox, the host filesystem path `../docs/` is not mounted, causing `fs.existsSync()` to return `false` and `loadMarkdownEntries()` to return an empty array `[]`.
- **Resolutions:**
  1. Replaced `node:fs` and `node:path` in `site/src/pages/logbook.astro` with Vite's compile-time `import.meta.glob("../../docs/decisions/*.md", { query: "?raw", import: "default", eager: true })` and `import.meta.glob("../../docs/hurdles/*.md", { query: "?raw", import: "default", eager: true })`.
  2. Because Vite resolves `import.meta.glob` on the Ubuntu host during the Rollup/Vite bundling phase before `workerd` prerendering begins, all ADR and Hurdle Markdown files are embedded directly into the prerendered `/logbook/index.html` output.
