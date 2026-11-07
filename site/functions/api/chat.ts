export interface Env {
  AI: {
    run: (model: string, payload: Record<string, unknown>) => Promise< any >;
  };
  VECTOR_INDEX: {
    query: (
      vector: number[],
      options: { topK: number; returnMetadata?: boolean }
    ) => Promise<{
      matches: Array<{ id: string; score: number; metadata?: { content?: string; git_commit?: string } }>;
    }>;
  };
  MODEL_ID: string;
  EMBEDDING_MODEL_ID: string;
  SIMILARITY_THRESHOLD: string;
  MAX_PROMPT_LENGTH: string;
  ALLOWED_ORIGIN: string;
}

const PII_REGEX =
  /\b(\d{3}-\d{2}-\d{4}|\d{13,16}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;

function logStructuredEvent(
  requestId: string,
  event: string,
  status: number,
  latencyMs: number
): void {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      request_id: requestId,
      event,
      status,
      latency_ms: latencyMs,
    })
  );
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const corsHeaders = {
    "Access-Control-Allow-Origin": context.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Request-Id": requestId,
  };

  try {
    const body = (await context.request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string") {
      logStructuredEvent(requestId, "invalid_schema_type", 400, Date.now() - startTime);
      return new Response("Invalid request schema: 'prompt' must be a string.", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const cleanedPrompt = body.prompt.trim();
    const maxLen = Number.parseInt(context.env.MAX_PROMPT_LENGTH || "500", 10);

    if (cleanedPrompt.length === 0 || cleanedPrompt.length > maxLen) {
      logStructuredEvent(requestId, "prompt_length_violation", 400, Date.now() - startTime);
      return new Response(
        `Prompt must be between 1 and ${maxLen} characters.`,
        { status: 400, headers: corsHeaders }
      );
    }

    if (PII_REGEX.test(cleanedPrompt)) {
      logStructuredEvent(requestId, "pii_blocked", 403, Date.now() - startTime);
      return new Response("Request blocked: Sensitive PII detected.", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const embeddings = await context.env.AI.run(context.env.EMBEDDING_MODEL_ID, {
      text: [cleanedPrompt],
    });

    const vectorQuery = await context.env.VECTOR_INDEX.query(embeddings.data[0], {
      topK: 1,
      returnMetadata: true,
    });

    const threshold = Number.parseFloat(context.env.SIMILARITY_THRESHOLD || "0.70");
    const topMatch = vectorQuery.matches[0];

    if (!topMatch || topMatch.score < threshold) {
      logStructuredEvent(requestId, "similarity_refusal", 200, Date.now() - startTime);
      return new Response(
        "I do not have access to that information in Satyajit's verified portfolio.",
        { status: 200, headers: corsHeaders }
      );
    }

    const groundedText = topMatch.metadata?.content || topMatch.id;
    const systemInstruction = `You are Satyajit's portfolio AI. Answer using ONLY this verified context: ${groundedText}. If the answer is not in the context, refuse. Do not hallucinate.`;

    const aiStream = await context.env.AI.run(context.env.MODEL_ID, {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: cleanedPrompt },
      ],
      stream: true,
      temperature: 0.0,
      max_tokens: 256,
    });

    logStructuredEvent(requestId, "rag_stream_started", 200, Date.now() - startTime);
    return new Response(aiStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    logStructuredEvent(requestId, "edge_execution_error", 500, Date.now() - startTime);
    return new Response("Internal Edge Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
};
