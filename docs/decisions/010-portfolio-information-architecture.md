# ADR 010: Structural Layout & CSS Variable Theming

- **Status:** Accepted
- **Date:** 2026-11-16
- **Context:** To enforce the *Shibui* (understated craft) and *Ma* (intentional negative space) design principles without relying on a heavy JavaScript theme provider or complex Tailwind configuration files.
- **Decision:**
  1. Define a strict 6-color European editorial palette using CSS variables (`--color-brand-paper`, `--color-brand-slate`, `--color-brand-ink`, `--color-brand-cream`, `--color-brand-accent-light`, `--color-brand-accent-dark`) directly inside `site/src/styles/global.css` using the Tailwind v4 `@theme` directive.
  2. Implement an inline render-blocking `<script>` in `site/src/layouts/Layout.astro` that checks `localStorage` and `prefers-color-scheme` to apply the `dark` class before the DOM paints, preventing white-flash rendering artifacts.
  3. Replace heavy box-shadows and thick borders with strict 1px hairlines (`border-[#E0DCD3]` / `border-[#1E252B]`) to enforce the *Kanso* (elimination of the unnecessary) aesthetic across the Edge RAG Chat console.
