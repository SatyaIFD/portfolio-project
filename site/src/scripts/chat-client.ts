/**
 * Type-safe browser client for the Vraidaten Edge RAG Assistant.
 * Handles /api/health telemetry status, starter prompt chips,
 * character-bound validation, and dual-schema SSE token streaming.
 */

interface SseDeltaChoice {
  delta?: {
    content?: string;
  };
}

interface SseChunkPayload {
  choices?: SseDeltaChoice[];
  response?: string;
}

interface HealthResponsePayload {
  status?: string;
  config?: {
    primary_model?: string;
    similarity_threshold?: number;
  };
}

export function extractTokenFromSseLine(rawLine: string): string {
  const line = rawLine.trim();
  if (!line.startsWith("data:")) {
    return "";
  }

  const dataStr = line.slice(5).trim();
  if (!dataStr || dataStr === "[DONE]") {
    return "";
  }

  try {
    const parsed = JSON.parse(dataStr) as SseChunkPayload;
    const deltaContent = parsed.choices?.[0]?.delta?.content;
    if (typeof deltaContent === "string") {
      return deltaContent;
    }
    if (typeof parsed.response === "string") {
      return parsed.response;
    }
  } catch {
    return "";
  }

  return "";
}

async function updateHealthBadge(
  dotEl: HTMLElement,
  textEl: HTMLElement
): Promise<void> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error("Health check returned non-200 status");
    }
    const data = (await response.json()) as HealthResponsePayload;
    if (data.status === "healthy") {
      dotEl.className = "h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse";
      const modelShort =
        data.config?.primary_model?.split("/").pop() ?? "granite-4.0-h-micro";
      textEl.textContent = `Edge AI Online · ${modelShort}`;
      return;
    }
  } catch {
    // Fall through to degraded indicator
  }

  dotEl.className = "h-2.5 w-2.5 rounded-full bg-amber-400";
  textEl.textContent = "Edge AI Standby";
}

function appendMessageBubble(
  container: HTMLElement,
  role: "user" | "assistant",
  initialText: string
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    role === "user" ? "flex justify-end" : "flex justify-start";

  const bubble = document.createElement("div");
  bubble.className =
    role === "user"
      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[#D9534F]/15 dark:bg-[#E87A5D]/20 border border-[#D9534F]/30 dark:border-[#E87A5D]/40 px-4 py-3 text-sm text-[#1E252B] dark:text-[#EAE6DF] whitespace-pre-wrap"
      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-[#1E252B] border border-[#E0DCD3] dark:border-slate-700 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed";

  bubble.textContent = initialText;
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  bubbleEl: HTMLElement,
  scrollContainer: HTMLElement
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const token = extractTokenFromSseLine(line);
      if (token) {
        accumulated += token;
        bubbleEl.textContent = accumulated;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }

  if (buffer.trim()) {
    const trailingToken = extractTokenFromSseLine(buffer);
    if (trailingToken) {
      accumulated += trailingToken;
      bubbleEl.textContent = accumulated;
    }
  }

  if (!accumulated) {
    bubbleEl.textContent =
      "I do not have access to that information in Satyajit's verified portfolio.";
  }
}

export function initPortfolioChat(): void {
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const submitBtn = document.getElementById("chat-submit");
  const charCountEl = document.getElementById("char-count");
  const messagesEl = document.getElementById("chat-messages");
  const statusDotEl = document.getElementById("health-dot");
  const statusTextEl = document.getElementById("health-text");

  if (statusDotEl && statusTextEl) {
    void updateHealthBadge(statusDotEl, statusTextEl);
  }

  if (
    !(formEl instanceof HTMLFormElement) ||
    !(inputEl instanceof HTMLTextAreaElement) ||
    !(submitBtn instanceof HTMLButtonElement) ||
    !(messagesEl instanceof HTMLElement)
  ) {
    return;
  }

  inputEl.addEventListener("input", () => {
    if (charCountEl) {
      charCountEl.textContent = `${inputEl.value.length} / 500`;
    }
  });

  const starterButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-starter-prompt]"
  );
  for (const btn of starterButtons) {
    btn.addEventListener("click", () => {
      const promptText = btn.getAttribute("data-starter-prompt");
      if (promptText && !submitBtn.disabled) {
        inputEl.value = promptText;
        if (charCountEl) {
          charCountEl.textContent = `${inputEl.value.length} / 500`;
        }
        formEl.requestSubmit();
      }
    });
  }

  formEl.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = inputEl.value.trim();
    if (!prompt || prompt.length > 500 || submitBtn.disabled) {
      return;
    }

    inputEl.value = "";
    if (charCountEl) {
      charCountEl.textContent = "0 / 500";
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Streaming...";

    appendMessageBubble(messagesEl, "user", prompt);
    const assistantBubble = appendMessageBubble(
      messagesEl,
      "assistant",
      "Querying Vectorize (vraidaten-index)..."
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!response.ok) {
        const errorText = await response.text();
        assistantBubble.textContent =
          errorText || `Request failed (HTTP ${response.status}).`;
      } else if (
        contentType.includes("text/event-stream") &&
        response.body !== null
      ) {
        await consumeSseStream(response.body, assistantBubble, messagesEl);
      } else {
        const plainText = await response.text();
        assistantBubble.textContent = plainText;
      }
    } catch {
      assistantBubble.textContent =
        "Network error while reaching the Cloudflare Edge Worker.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Query";
    }
  });
}

initPortfolioChat();
