# ADR 009: Honest Career-Transition Positioning, 3-Tier Skill Transparency & Floating Edge RAG Widget

- **Status:** Accepted (Updated 2026-11-18)
- **Date:** 2026-11-18
- **Context:** The portfolio (`vraidaten.com`) represents Satyajit Chakraborty (9 years 5 months at TCS BPS across UK NEST Pensions and Bank of America/US Healthcare; B.Com Hons, University of Calcutta), who is transitioning into Junior Cloud Engineering, Cloud ML, Cloud Operations, and MLOps roles. The site must present his TCS awards, stakeholder communication experience, and technical capabilities transparently without overclaiming or mispositioning him as a DevSecOps specialist.
- **Decision:**
  1. Present Satyajit's refined introduction, NEST customer communication responsibilities, and 4 TCS awards (BPS Star Performance, Service and Commitment, Xcelerate Warrior, and Internal Dedication – Bank of America HIPAA) on the homepage.
  2. Classify technical skills into three explicit tiers (*Completed / Demonstrated*, *Currently Practising*, and *Planned Learning*) so recruiters and interviewers have an accurate picture of current hands-on capability versus upcoming study areas.
  3. Frame the current website project as *VraiDaten Portfolio & Edge AI Assistant* (treating automated security checks and keyring secret management as good engineering practices rather than a DevSecOps career title).
  4. Mount the Edge RAG Assistant as a viewport-fixed floating widget (`fixed bottom-5 right-4 sm:right-6 z-50`) in `site/src/layouts/Layout.astro`.
