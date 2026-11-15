# ADR 009: Astro 7 Portfolio UI, Dual-Schema SSE Client & EU AI Act Transparency

- **Status:** Accepted
- **Date:** 2026-11-15
- **Context:** Visitors to `vraidaten.com` require a responsive, accessible interface to explore Satyajit's MLOps and Cloud Architecture work and query the `/api/chat` edge RAG endpoint in real time. Furthermore, newer Cloudflare Workers AI models (`@cf/ibm-granite/granite-4.0-h-micro` and `@cf/google/gemma-4-26b-a4b-it`) stream tokens using the OpenAI-compatible `choices[0].delta.content` JSON schema rather than the legacy top-level `response` string, and EU AI Act Article 50 mandates clear transparency disclosure for interactive AI systems.
- **Decision:**
  1. Build the portfolio and interactive RAG console in `site/src/pages/index.astro` styled with Tailwind CSS v4 (`@tailwindcss/vite`) and prerendered as a static edge asset (`ASSETS`) for sub-100ms global delivery.
  2. Implement the browser streaming logic in a dedicated TypeScript module (`site/src/scripts/chat-client.ts`) checked by `tsc --noEmit` (`make typecheck`), parsing both `choices[0].delta.content` and legacy `response` SSE frames while rendering all user and assistant text exclusively via `textContent` to prevent DOM XSS.
  3. Display an explicit EU AI Act Article 50 transparency badge, live `/api/health` binding status indicator, 1-500 character input counter, and GDPR zero-PII notice directly inside the chat console.
