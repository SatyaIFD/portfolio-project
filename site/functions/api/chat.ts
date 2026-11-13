/**
 * Edge RAG endpoint powered by Cloudflare Workers AI, Vectorize, and Rate Limiting.
 */

interface Env {
  AI: any;
  VECTORIZE: any;
  RATE_LIMITER: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}

interface RequestPayload {
  prompt: string;
}

const DEFAULT_EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";
const DEFAULT_LLM = "@cf/meta/llama-3-8b-instruct-awq";
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_ERROR = 500;
const VECTOR_MATCH_LIMIT = 3;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const request = context.request;
    const env = context.env;
    
    // 1. IP-Based Rate Limiting to protect the Edge Budget
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait 60 seconds." }), 
        {
          status: HTTP_TOO_MANY_REQUESTS,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = (await request.json()) as RequestPayload;

    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
        status: HTTP_BAD_REQUEST,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userPrompt = body.prompt.trim();

    // 2. Embed the user's query
    const embedResponse = await env.AI.run(DEFAULT_EMBEDDING_MODEL, {
      text: [userPrompt],
    });
    
    if (!embedResponse?.data?.[0]) {
      throw new Error("Failed to generate embedding array.");
    }
    
    const queryVector = embedResponse.data[0];

    // 3. Query Vectorize for top matches (includes co-located metadata text)
    const vectorMatches = await env.VECTORIZE.query(queryVector, {
      topK: VECTOR_MATCH_LIMIT,
      returnValues: false,
      returnMetadata: "all",
    });

    // 4. Assemble the prompt context
    let contextStr = "";
    if (vectorMatches.matches && vectorMatches.matches.length > 0) {
      contextStr = vectorMatches.matches
        .map((match: any) => match.metadata?.text || "")
        .join("\n\n");
    }

    const systemPrompt = `You are a helpful MLOps AI assistant for Satyajit's portfolio project. 
Answer the user's question using ONLY the provided context. If the answer is not in the context, say so.
Context:\n${contextStr}`;

    // 5. Generate the LLM response using the high-speed int4 AWQ model
    const llmResponse = await env.AI.run(DEFAULT_LLM, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return new Response(JSON.stringify({ response: llmResponse.response }), {
      status: HTTP_OK,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("RAG Worker Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: HTTP_INTERNAL_ERROR,
      headers: { "Content-Type": "application/json" },
    });
  }
};
