# ADR 010: Low-Glare Warm Stone & Dusk Palette, Custom Brand SVGs & Floating RAG UI

- **Status:** Accepted (Updated 2026-11-18)
- **Date:** 2026-11-18
- **Context:** Pure white (`#FFFFFF`) and high-luminance off-white (`#F4F2EC`) surfaces cause eye strain during extended reading. The visual design must pair Japanese structural clarity (*Ma* negative space, *Kanso* simplicity) with an eye-friendly European palette harmonized with `Favi2.svg` and `vraidaten-logo.svg` (`#003399` Royal Blue and `#006400` Forest Green).
- **Decision:**
  1. Eliminate `#FFFFFF` across the entire UI. Use a Warm Washi Stone palette for Paper Mode (`#DED8CA` background, `#E7E2D6` card surfaces, `#D4CEBE` recessed headers, `#BDB5A2` borders, `#1E242B` ink) and a Soft European Dusk Slate for Dark Mode (`#15181E` background, `#1C2028` cards, `#2B313C` borders, `#DFDBD2` parchment text).
  2. Serve `site/public/Favi2.svg` and `site/public/vraidaten-logo.svg` in the sticky header and use `@custom-variant dark (&:where(.dark, .dark *));` in `global.css` for instant Paper/Dusk theme switching.
