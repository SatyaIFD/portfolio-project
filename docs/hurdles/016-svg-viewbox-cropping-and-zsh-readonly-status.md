# Hurdle 016: Inkscape Object-to-Path Cropping, Browser Favicon Cache Busting & Zsh Read-Only status Variable

- **Symptoms:**
  1. The initial `assets/Favi2.svg` used an A4 canvas (`viewBox="0 0 210 297"`) and Inkscape `shape-inside` flowed text, and Astro still had starter `favicon.ico` and `favicon.svg` files in `site/public/`, causing browsers to display the wrong cached icon.
  2. `git ls-files` revealed an accidentally tracked `.secrets.baselin` typo file alongside `.secrets.baseline`.
  3. Running a verification loop in Zsh with `status=$(curl ...)` failed immediately with `zsh: read-only variable: status`.
- **Root Causes:**
  1. Browsers aggressively cache `/favicon.ico` and `/favicon.svg` and ignore SVG 2 `shape-inside` text containers inside icon links.
  2. An earlier command typo created `.secrets.baselin` before `.secrets.baseline` was standardized.
  3. In Zsh, `$status` is a built-in read-only shell variable bound to the last command exit code (`$?`).
- **Resolutions:**
  1. Converted the `V` (`#003399`) and `D` (`#006400`) glyphs in `assets/Favi2.svg` to pure `<path>` outlines cropped to `viewBox="0 0 127.74231 147.2406"` in Inkscape, copied `assets/Favi2.svg` verbatim to `site/public/Favi2.svg`, deleted `site/public/favicon.ico` and `site/public/favicon.svg`, and updated `Layout.astro` to reference `/Favi2.svg`.
  2. Removed `.secrets.baselin` from Git tracking via `git rm -f .secrets.baselin`.
  3. Renamed the loop variable from `status` to `http_code` when verifying live HTTP status codes in Zsh.
