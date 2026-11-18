# ADR 009: Honest Career-Transition Positioning, Floating Edge RAG Widget & 4-Page Structure

- **Status:** Accepted (Updated 2026-11-18)
- **Date:** 2026-11-18
- **Context:** The portfolio (`vraidaten.com`) represents Satyajit Chakraborty (9 years 5 months at TCS BPS across UK NEST Pensions and Bank of America/US Healthcare; B.Com Hons, University of Calcutta), who is transitioning into Junior Cloud Engineering, Cloud ML, and MLOps roles. The site must present his credentials honestly without overclaiming, provide a low-glare reading experience, and make the Edge RAG assistant accessible from a floating corner button across all pages.
- **Decision:**
  1. Structure the site across 4 pages: `/` (Home — Professional Summary, TCS Operations-to-Cloud Journey, Technical Learning & Honest Comfort Level), `/projects` (Current Website Project & Planned GCP End-to-End Implementation), `/logbook` (Build-time ADR & Hurdle Archive), and `/contact` (Target Junior Roles, Collaborative Work Models & LinkedIn `linkedin.com/in/satyajitchakraborty91`).
  2. Mount the Edge RAG Assistant as a viewport-fixed floating widget (`fixed bottom-6 right-6 z-50`) in `site/src/layouts/Layout.astro` so it floats in the bottom-right corner while scrolling on every page, complete with EU AI Act Article 50 disclosure.
