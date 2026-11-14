/**
 * Hardened Astro Edge RAG endpoint (/api/chat) with schema parity,
 * similarity gating, GDPR-compliant structured telemetry, and FP8-fast streaming.
 */
import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

export const prerender = false;

export interface VectorizeMatchMetadata {
  text?: string;
  content?: string;
  source_file?: string;
  git_commit?: string;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: VectorizeMatchMetadata;
}

export interface AiEmbeddingResponse {
  data?: number[][];
}

export interface RuntimeEnv {
  AI: {
    run: (
      model: string,
      payload: Record<string, unknown>
    ) => Promise<AiEmbeddingResponse | ReadableStream>;
  };
  VECTOR_INDEX: {
    query: (
      vector: number[],
      options: { topK: number; returnValues?: boolean; returnMetadata?: "all" | boolean }
    ) => Promise<{
      matches: VectorizeMatch[];
    }>;
  };
  RATE_LIMITER?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
  MODEL_ID: string;
  EMBEDDING_MODEL_ID: string;
  SIMILARITY_THRESHOLD: string;
  MAX_PROMPT_LENGTH: string;
  MAX_OUTPUT_TOKENS: string;
  VECTOR_TOP_K: string;
  ALLOWED_ORIGIN: string;
}

const PII_REGEX =
  /\b(\d{3}-\d{2}-\d{4}|\d{13,16}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;

const HTTP_NO_CONTENT = 204;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_ERROR = 500;

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

function buildCorsHeaders(allowedOrigin: string, requestId: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "https://vraidaten.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Request-Id": requestId,
  };
}

export const OPTIONS: APIRoute = async () => {
  const runtimeEnv = cfEnv as unknown as RuntimeEnv;
  const requestId = crypto.randomUUID();
  return new Response(null, {
    status: HTTP_NO_CONTENT,
    headers: buildCorsHeaders(runtimeEnv.ALLOWED_ORIGIN, requestId),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const runtimeEnv = cfEnv as unknown as RuntimeEnv;
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const corsHeaders = buildCorsHeaders(runtimeEnv.ALLOWED_ORIGIN, requestId);

  try {
    if (runtimeEnv.RATE_LIMITER) {
      const clientKey = request.headers.get("CF-Connecting-IP") || "anonymous";
      const { success } = await runtimeEnv.RATE_LIMITER.limit({ key: clientKey });
      if (!success) {
        logStructuredEvent(
          requestId,
          "rate_limit_exceeded",
          HTTP_TOO_MANY_REQUESTS,
          Date.now() - startTime
        );
        return new Response("Rate limit exceeded. Please wait 60 seconds.", {
          status: HTTP_TOO_MANY_REQUESTS,
          headers: corsHeaders,
        });
      }
    }

    const body = (await request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string") {
      logStructuredEvent(
        requestId,
        "invalid_schema_type",
        HTTP_BAD_REQUEST,
        Date.now() - startTime
      );
      return new Response("Invalid request schema: 'prompt' must be a string.", {
        status: HTTP_BAD_REQUEST,
        headers: corsHeaders,
      });
    }

    const cleanedPrompt = body.prompt.trim();
    const maxLen = Number.parseInt(runtimeEnv.MAX_PROMPT_LENGTH || "500", 10);

    if (cleanedPrompt.length === 0 || cleanedPrompt.length > maxLen) {
      logStructuredEvent(
        requestId,
        "prompt_length_violation",
        HTTP_BAD_REQUEST,
        Date.now() - startTime
      );
      return new Response(
        `Prompt must be between 1 and ${maxLen} characters.`,
        { status: HTTP_BAD_REQUEST, headers: corsHeaders }
      );
    }

    if (PII_REGEX.test(cleanedPrompt)) {
      logStructuredEvent(
        requestId,
        "pii_blocked",
        HTTP_FORBIDDEN,
        Date.now() - startTime
      );
      return new Response("Request blocked: Sensitive PII detected.", {
        status: HTTP_FORBIDDEN,
        headers: corsHeaders,
      });
    }

    const embedResult = (await runtimeEnv.AI.run(
      runtimeEnv.EMBEDDING_MODEL_ID,
      { text: [cleanedPrompt] }
    )) as AiEmbeddingResponse;

    const queryVector = embedResult.data?.[0];
    if (!queryVector) {
      throw new Error("Embedding generation returned empty vector.");
    }

    const topK = Number.parseInt(runtimeEnv.VECTOR_TOP_K || "3", 10);
    const vectorQuery = await runtimeEnv.VECTOR_INDEX.query(queryVector, {
      topK,
      returnValues: false,
      returnMetadata: "all",
    });

    const threshold = Number.parseFloat(
      runtimeEnv.SIMILARITY_THRESHOLD || "0.70"
    );
    const validMatches = (vectorQuery.matches || []).filter(
      (match) => match.score >= threshold
    );

    if (validMatches.length === 0) {
      logStructuredEvent(
        requestId,
        "similarity_refusal",
        HTTP_OK,
        Date.now() - startTime
      );
      return new Response(
        "I do not have access to that information in Satyajit's verified portfolio.",
        { status: HTTP_OK, headers: corsHeaders }
      );
    }

    const groundedText = validMatches
      .map((match) => match.metadata?.text || match.metadata?.content || match.id)
      .join("\n\n");

    const systemInstruction = `You are Satyajit's portfolio AI. Answer using ONLY this verified context:\n${groundedText}\nIf the answer is not in the context, refuse. Do not hallucinate.`;
    const maxTokens = Number.parseInt(
      runtimeEnv.MAX_OUTPUT_TOKENS || "256",
      10
    );

    const aiStream = (await runtimeEnv.AI.run(runtimeEnv.MODEL_ID, {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: cleanedPrompt },
      ],
      stream: true,
      temperature: 0.0,
      max_tokens: maxTokens,
    })) as ReadableStream;

    logStructuredEvent(
      requestId,
      "rag_stream_started",
      HTTP_OK,
      Date.now() - startTime
    );
    return new Response(aiStream, {
      status: HTTP_OK,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    logStructuredEvent(
      requestId,
      "edge_execution_error",
      HTTP_INTERNAL_ERROR,
      Date.now() - startTime
    );
    return new Response("Internal Edge Error", {
      status: HTTP_INTERNAL_ERROR,
      headers: corsHeaders,
    });
  }
};
