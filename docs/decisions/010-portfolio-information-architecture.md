# ADR 010: Structural Layout, Custom Brand SVGs & European Blue/Green Theming

- **Status:** Accepted (Updated 2026-11-16)
- **Date:** 2026-11-16
- **Context:** To enforce the Japanese *Shibui* (understated craft) and *Ma* (intentional negative space) principles while harmonizing the UI palette with Satyajit's custom Inkscape brand assets (`assets/Favi2.svg` and `assets/vraidaten-logo.svg`), which pair European Royal Blue (`#003399` for `Vrai`) and Deep Forest Green (`#006400` for `Daten`).
- **Decision:**
  1. Define the European editorial palette in `site/src/styles/global.css` using warm Washi/Alabaster paper (`#F4F2EC`) and Deep Dusk Slate (`#0F1115`) paired with `#003399` / `#5B8DEF` (European Blue) and `#006400` / `#4E9F6E` (Forest Green) accents.
  2. Serve the tightly cropped pure-vector `VD` monogram (`site/public/favicon.svg`) and `VraiDaten` wordmark (`site/public/vraidaten-logo.svg`) in `site/src/layouts/Layout.astro` with an inline render-blocking theme script to prevent white-flash artifacts.
  3. Use strict 1px structural hairlines (`#E0DCD3` / `#1E252B`) across all 4 pages (`/`, `/projects`, `/logbook`, `/contact`).
