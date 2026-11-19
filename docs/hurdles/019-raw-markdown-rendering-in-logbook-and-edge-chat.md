# Hurdle 019: Raw Markdown Syntax Visible in Engineering Logbook & Streamed Edge AI Responses

- **Symptoms:**
  1. Expanding entries on `/logbook` displayed literal Markdown punctuation (`**Status:**`, `- `, `` `@cf/ibm-granite/granite-4.0-h-micro` ``, `*italics*`) inside a `<pre>` block instead of formatted bold text, styled inline code chips, and nested bullet lists.
  2. Streamed responses from `/api/chat` inside the floating Edge AI assistant also displayed literal Markdown markers (`**`, `` ` ``, `- `) because `chat-client.ts` appended raw chunks directly to `textContent`.
- **Root Causes:**
  1. `site/src/pages/logbook.astro` rendered the raw Markdown string from `import.meta.glob(..., { query: "?raw" })` directly inside `<pre>{adr.body}</pre>`.
  2. `site/src/scripts/chat-client.ts` avoided `innerHTML` for XSS protection by assigning raw text directly to `bubble.textContent`, leaving Markdown formatting unparsed.
- **Resolutions:**
  1. Created a zero-dependency, XSS-safe Markdown AST parser (`site/src/utils/markdown.ts`) supporting headings, paragraphs, ordered/unordered lists (including nested indented sub-items), fenced code blocks, `**bold**`, `*italic*`, and `` `inline code` ``.
  2. Updated `site/src/pages/logbook.astro` to render the parsed AST using native Astro JSX elements (zero `set:html`) and updated `site/src/scripts/chat-client.ts` to build structured DOM elements via `document.createElement()` and `document.createTextNode()` (zero `innerHTML`).
