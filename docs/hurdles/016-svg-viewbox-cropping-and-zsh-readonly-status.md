# Hurdle 016: Inkscape A4 ViewBox/Flowed-Text Cropping, Stray Baseline File & Zsh Read-Only status Variable

- **Symptoms:**
  1. The custom `assets/Favi2.svg` icon was created on a full A4 canvas (`viewBox="0 0 210 297"`) using Inkscape SVG 2 flowed text (`shape-inside:url(#rect3)`), which browsers ignore inside `<link rel="icon">` and `<img>` tags, leaving the default Astro starter icon in `site/public/favicon.svg`.
  2. `git ls-files` revealed an accidentally tracked `.secrets.baselin` typo file alongside `.secrets.baseline`.
  3. Running a verification loop in Zsh with `status=$(curl ...)` failed immediately with `zsh: read-only variable: status`.
- **Root Causes:**
  1. Static assets outside `site/public/` are not served by Astro, and browser SVG renderers require standard `<path>` geometry and a square icon `viewBox` (`0 0 64 64`) rather than A4 document dimensions and `shape-inside` text containers.
  2. An earlier command typo created `.secrets.baselin` before `.secrets.baseline` was standardized.
  3. In Zsh, `$status` is a built-in read-only shell variable bound to the last command exit code (`$?`).
- **Resolutions:**
  1. Extracted the exact `DejaVu Sans Bold` `V` (`#003399`) and `D` (`#006400`) vector `<path>` glyphs with their matrix transforms into a 64x64 `site/public/favicon.svg` and copied `assets/vraidaten-logo.svg` into `site/public/vraidaten-logo.svg`.
  2. Removed `.secrets.baselin` from Git tracking via `git rm -f .secrets.baselin`.
  3. Renamed the loop variable from `status` to `http_code` when verifying live HTTP status codes in Zsh.
