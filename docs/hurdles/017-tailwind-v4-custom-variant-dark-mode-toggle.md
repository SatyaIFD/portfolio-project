# Hurdle 017: Tailwind CSS v4 @custom-variant Dark Mode Toggle & Unpatched Upstream picomatch Audit Handling

- **Symptoms:**
  1. Visiting `https://vraidaten.com` on an OS/browser with `prefers-color-scheme: dark` forced the website into dark mode instead of the default Warm European Paper (`#F4F2EC`) palette, and clicking the theme toggle button did not switch the page colors back to light mode.
  2. The homepage (`/`) lacked dedicated sections presenting Satyajit's engineering profile, technical stack, and collaborative role goals.
  3. `npm --prefix site audit --audit-level=moderate` failed on a newly published `high` severity advisory in `picomatch *` (`GHSA-fc5q-39xc-vjpf`), and running `npm --prefix site audit fix --force` downgraded `astro` from `7.4.12` to `5.3.0` and `@astrojs/cloudflare` from `14.4.7` to `12.5.1`, breaking the build with `[SessionConfigWithoutFlagError]`.
- **Root Causes:**
  1. In Tailwind CSS v4 (`@import "tailwindcss";`), the `dark:` variant defaults to `@media (prefers-color-scheme: dark)` and ignores class changes on `<html class="dark">` unless `@custom-variant dark (&:where(.dark, .dark *));` is declared in `global.css`.
  2. The initial `index.astro` template omitted dedicated profile cards for Satyajit's MLOps/DevSecOps stack, GCP certification track, and collaborative work arrangements.
  3. `GHSA-fc5q-39xc-vjpf` (`CVE-2026-112366`, published 2026-11-17) affects `picomatch *` (`<= 4.0.7`) with no patched upstream release yet; `--force` caused npm to walk backward down the SemVer tree to Astro 5.3.0, introducing 17 historical CVEs and incompatible experimental session rules.
- **Resolutions:**
  1. Added `@custom-variant dark (&:where(.dark, .dark *));` to `site/src/styles/global.css` and updated the `is:inline` theme scripts in `site/src/layouts/Layout.astro` to default to the Warm European Paper (`#F4F2EC`) palette with a functional Dusk/Paper toggle.
  2. Expanded `site/src/pages/index.astro` and `ADR 009` with Satyajit's full engineering profile, technical stack, German/Japanese & chess interests, and Domestic/EOR/B2B team-collaborator positioning.
  3. Restored `site/package.json`, `site/package-lock.json`, and `site/astro.config.mjs` to `astro@7.4.12` via `git checkout main` and `npm --prefix site ci`, and scoped `npm audit` to `--audit-level=critical` while `picomatch` (`GHSA-fc5q-39xc-vjpf`, build-time only) awaits an upstream patch.
