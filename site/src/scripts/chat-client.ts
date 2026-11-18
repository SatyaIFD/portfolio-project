/**
 * Browser client for the floating Vraidaten Edge RAG Assistant (/api/chat).
 * Uses textContent exclusively to prevent DOM-based XSS.
 */

function appendMessageBubble(container: HTMLElement, role: "user" | "assistant"): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = role === "user" ? "flex justify-end" : "flex justify-start";

  const bubble = document.createElement("div");
  bubble.className =
    role === "user"
      ? "max-w-[88%] rounded-xl rounded-br-sm bg-brand-accent-light/15 dark:bg-brand-accent-dark/20 border border-brand-accent-light/35 dark:border-brand-accent-dark/40 px-3.5 py-2.5 text-xs text-brand-ink dark:text-brand-cream whitespace-pre-wrap"
      : "max-w-[88%] rounded-xl rounded-bl-sm bg-brand-surface dark:bg-brand-slate-surface border border-brand-border dark:border-brand-slate-border px-3.5 py-2.5 text-xs text-brand-ink dark:text-brand-cream whitespace-pre-wrap leading-relaxed";

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function extractSseToken(rawLine: string): string {
  const trimmed = rawLine.trim();
  if (!trimmed.startsWith("data:")) {
    return "";
  }
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") {
    return "";
  }
  try {
    const parsed = JSON.parse(payload) as {
      response?: string;
      choices?: Array<{ delta?: { content?: string } }>;
    };
    if (typeof parsed.response === "string" && parsed.response.length > 0) {
      return parsed.response;
    }
    const deltaContent = parsed.choices?.[0]?.delta?.content;
    if (typeof deltaContent === "string" && deltaContent.length > 0) {
      return deltaContent;
    }
  } catch {
    return "";
  }
  return "";
}

function initFloatingRagAssistant(): void {
  const fabBtn = document.getElementById("ai-fab-toggle") as HTMLButtonElement | null;
  const chatPanel = document.getElementById("ai-chat-panel") as HTMLElement | null;
  const closeBtn = document.getElementById("ai-chat-close") as HTMLButtonElement | null;
  const form = document.getElementById("chat-form") as HTMLFormElement | null;
  const input = document.getElementById("chat-input") as HTMLTextAreaElement | null;
  const submitBtn = document.getElementById("chat-submit") as HTMLButtonElement | null;
  const messages = document.getElementById("chat-messages") as HTMLElement | null;
  const charCount = document.getElementById("char-count") as HTMLElement | null;

  function openPanel(): void {
    if (!chatPanel || !fabBtn) return;
    chatPanel.classList.remove("hidden");
    chatPanel.classList.add("flex");
    fabBtn.setAttribute("aria-expanded", "true");
    input?.focus();
  }

  function closePanel(): void {
    if (!chatPanel || !fabBtn) return;
    chatPanel.classList.add("hidden");
    chatPanel.classList.remove("flex");
    fabBtn.setAttribute("aria-expanded", "false");
  }

  fabBtn?.addEventListener("click", () => {
    const isHidden = chatPanel?.classList.contains("hidden");
    if (isHidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  closeBtn?.addEventListener("click", () => {
    closePanel();
  });

  document.querySelectorAll<HTMLElement>("[data-open-ai-chat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openPanel();
    });
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && chatPanel && !chatPanel.classList.contains("hidden")) {
      closePanel();
    }
  });

  if (!form || !input || !submitBtn || !messages) {
    return;
  }

  input.addEventListener("input", () => {
    if (charCount) {
      charCount.textContent = `${input.value.length} / 500`;
    }
  });

  document.querySelectorAll<HTMLButtonElement>("[data-starter-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const starter = btn.getAttribute("data-starter-prompt") ?? "";
      if (starter) {
        openPanel();
        input.value = starter;
        if (charCount) {
          charCount.textContent = `${input.value.length} / 500`;
        }
        form.requestSubmit();
      }
    });
  });

  form.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) {
      return;
    }

    input.value = "";
    if (charCount) {
      charCount.textContent = "0 / 500";
    }
    submitBtn.disabled = true;

    const userBubble = appendMessageBubble(messages, "user");
    userBubble.textContent = prompt;

    const assistantBubble = appendMessageBubble(messages, "assistant");
    assistantBubble.textContent = "Querying Vectorize & Edge SLM...";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("application/json")) {
        const data = (await response.json()) as { answer?: string; error?: string };
        assistantBubble.textContent =
          data.answer ?? data.error ?? `Request failed with HTTP ${response.status}.`;
        return;
      }

      if (!response.body) {
        assistantBubble.textContent = "No response stream available.";
        return;
      }

      assistantBubble.textContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const token = extractSseToken(line);
          if (token) {
            assistantBubble.textContent += token;
            messages.scrollTop = messages.scrollHeight;
          }
        }
      }

      if (buffer.trim()) {
        const finalToken = extractSseToken(buffer);
        if (finalToken) {
          assistantBubble.textContent += finalToken;
        }
      }

      if (!assistantBubble.textContent) {
        assistantBubble.textContent = "Stream completed with no output tokens.";
      }
    } catch {
      assistantBubble.textContent = "Network error communicating with /api/chat.";
    } finally {
      submitBtn.disabled = false;
      input.focus();
    }
  });
}

initFloatingRagAssistant();
