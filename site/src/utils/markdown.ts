/**
 * Zero-dependency, XSS-safe Markdown AST parser shared by /logbook (Astro JSX)
 * and the floating Edge AI assistant (safe DOM node construction, zero innerHTML).
 */

export type LeafToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string };

export type InlineToken =
  | LeafToken
  | { type: "bold"; children: LeafToken[] }
  | { type: "italic"; children: LeafToken[] };

export interface ListItem {
  indent: number;
  tokens: InlineToken[];
}

export type MarkdownBlock =
  | { type: "heading"; level: number; tokens: InlineToken[] }
  | { type: "paragraph"; tokens: InlineToken[] }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "codeblock"; content: string };

const CODE_SPAN_PATTERN = /(`[^`\n]+`)/g;
const INLINE_PATTERN =
  /(`[^`\n]+`|\*\*(?:`[^`\n]+`|[^*`\n])+\*\*|\*[^*\s`](?:[^*\n`]*[^*\s`])?\*)/g;

function parseCodeSpans(text: string): LeafToken[] {
  const tokens: LeafToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(CODE_SPAN_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }
    const raw = match[0];
    tokens.push({ type: "code", value: raw.slice(1, -1) });
    lastIndex = matchIndex + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }

    const raw = match[0];
    if (raw.startsWith("`") && raw.endsWith("`")) {
      tokens.push({ type: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push({ type: "bold", children: parseCodeSpans(raw.slice(2, -2)) });
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push({ type: "italic", children: parseCodeSpans(raw.slice(1, -1)) });
    } else {
      tokens.push({ type: "text", value: raw });
    }

    lastIndex = matchIndex + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];

  let paragraphLines: string[] = [];
  let currentList: { ordered: boolean; items: ListItem[] } | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        tokens: parseInline(paragraphLines.join(" ").trim()),
      });
      paragraphLines = [];
    }
  };

  const flushList = (): void => {
    if (currentList && currentList.items.length > 0) {
      blocks.push({
        type: "list",
        ordered: currentList.ordered,
        items: currentList.items,
      });
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        blocks.push({ type: "codeblock", content: codeLines.join("\n") });
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        tokens: parseInline(headingMatch[2].trim()),
      });
      continue;
    }

    const unorderedMatch = /^(\s*)[-*]\s+(.+)$/.exec(line);
    if (unorderedMatch) {
      flushParagraph();
      const indent = unorderedMatch[1].length >= 2 ? 1 : 0;
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push({
        indent,
        tokens: parseInline(unorderedMatch[2].trim()),
      });
      continue;
    }

    const orderedMatch = /^(\s*)\d+\.\s+(.+)$/.exec(line);
    if (orderedMatch) {
      flushParagraph();
      const indent = orderedMatch[1].length >= 2 ? 1 : 0;
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push({
        indent,
        tokens: parseInline(orderedMatch[2].trim()),
      });
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: "codeblock", content: codeLines.join("\n") });
  }
  flushParagraph();
  flushList();

  return blocks;
}
