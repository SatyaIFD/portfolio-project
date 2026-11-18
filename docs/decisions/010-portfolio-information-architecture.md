# ADR 010: Warm Yellowish-Cream Book-Paper Palette, Custom Brand SVGs & Dusk Mode Toggle

- **Status:** Accepted (Updated 2026-11-18)
- **Date:** 2026-11-18
- **Context:** White (`#FFFFFF`) and cool/grey-beige surfaces retain high blue-channel luminance ($B > 200$ in sRGB), causing digital eye strain. A warm yellowish-cream book-paper palette (similar to vintage chamois paper or e-reader Sepia/Warm mode) significantly reduces blue-channel light emission while harmonizing with `Favi2.svg` and `vraidaten-logo.svg` (`#003399` Royal Blue and `#006400` Forest Green).
- **Decision:**
  1. Set Paper Mode to a warm yellowish-cream palette: `#EADCB8` page canvas ($R=234, G=220, B=184$), `#F1E6C8` soft cream cards, `#DECDA2` warm buff recessed headers/tags, `#C4B284` ochre-sand borders, `#231F18` warm espresso ink, and `#4A4235` umber secondary text.
  2. Retain the optional Dusk Mode (`#15181E` canvas, `#1C2028` cards, `#DFDBD2` warm parchment text) via `@custom-variant dark (&:where(.dark, .dark *));` in `site/src/styles/global.css`.
