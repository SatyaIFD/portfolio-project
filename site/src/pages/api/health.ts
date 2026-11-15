/**
 * Zero-Neuron Edge Serviceability & Health Endpoint (/api/health).
 * Verifies Worker bindings and reports active model configuration.
 */
import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import type { RuntimeEnv } from "./chat";

export const prerender = false;

const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;

export const GET: APIRoute = async () => {
  const runtimeEnv = cfEnv as unknown as RuntimeEnv;
  const requestId = crypto.randomUUID();
  const bindingsReady = Boolean(runtimeEnv.AI && runtimeEnv.VECTOR_INDEX);
  const status = bindingsReady ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE;

  const payload = {
    status: bindingsReady ? "healthy" : "degraded",
    request_id: requestId,
    timestamp: new Date().toISOString(),
    bindings: {
      ai: Boolean(runtimeEnv.AI),
      vector_index: Boolean(runtimeEnv.VECTOR_INDEX),
      rate_limiter: Boolean(runtimeEnv.RATE_LIMITER),
    },
    config: {
      primary_model: runtimeEnv.MODEL_ID,
      fallback_model: runtimeEnv.FALLBACK_MODEL_ID || null,
      embedding_model: runtimeEnv.EMBEDDING_MODEL_ID,
      similarity_threshold: Number.parseFloat(
        runtimeEnv.SIMILARITY_THRESHOLD || "0.60"
      ),
    },
  };

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
};
