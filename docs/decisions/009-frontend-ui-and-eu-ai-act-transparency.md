# ADR 009: Honest Portfolio Architecture, Japanese-European Aesthetic & 4-Page Structure

- **Status:** Accepted (Updated 2026-11-16)
- **Date:** 2026-11-16
- **Context:** The portfolio needs to accurately reflect Satyajit's career transition into MLOps/Cloud Architecture without overclaiming. The UI must position him as a collaborative team member (Domestic/EOR/B2B), explicitly acknowledge the use of AI tools, and provide an eye-friendly reading experience grounded in Japanese structural minimalism (*Ma*, *Kanso*) and warm European color palettes.
- **Decision:**
  1. Build a 4-page Astro 7 architecture: `/` (Honest Introduction & RAG Studio), `/projects` (Live DevSecOps Portfolio & Upcoming GCP Fraud Pipeline), `/logbook` (ADR & Hurdle Archive), and `/contact` (Reachability).
  2. Implement an eye-friendly, low-contrast Tailwind CSS v4 palette (warm alabaster for light mode, deep ink slate for dark mode) matching the monochrome vector aesthetic of the custom SVG favicon.
  3. Ensure the Edge RAG client (`site/src/scripts/chat-client.ts`) remains XSS-safe and includes the EU AI Act Article 50 transparency disclosure on the homepage.
