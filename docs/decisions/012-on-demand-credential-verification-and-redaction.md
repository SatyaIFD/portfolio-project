# ADR 012: On-Demand Credential Verification, Native Dialog Lightbox & Opaque Redaction

- **Status:** Accepted
- **Date:** 2026-11-20
- **Context:** Displaying verifiable learning badges and TCS award certificates strengthens recruiter trust, but embedding image galleries or hosting unredacted PDFs/CVs introduces page-weight bloat, visual clutter against the Japanese *Kanso* aesthetic, and personal/corporate data exposure risks in a public GitHub repository.
- **Decision:**
  1. Link third-party technical credentials directly to their official issuer verification URLs (`0 KB` hosted): Cisco Networking Academy Linux Essentials (Credly), IBM Machine Learning with Python (Cognitive Class), and Simplilearn Master's Program for Data Scientist.
  2. Serve the 4 redacted TCS award certificates (`bps-star-performance.webp`, `service-and-commitment3.webp`, `service-and-commitment5.webp`, and `xcelerate-warrior.webp`) from `site/public/certificates/` as compressed WebP images (max `1200px` wide, metadata stripped via RGB conversion).
  3. Render certificate previews strictly on demand inside a native HTML `dialog` lightbox (`site/src/scripts/cert-lightbox.ts`) that assigns `img.src` only when a user clicks a `"View Certificate"` button and clears `src` on close—maintaining `0 KB` initial image payload and zero new npm dependencies.
  4. Enforce opaque solid-fill redaction of Employee IDs, signatures, and internal emails before files enter Git, and keep the full CV PDF (containing DOB/phone) off the public site.
