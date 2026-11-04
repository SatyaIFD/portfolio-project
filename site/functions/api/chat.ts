export interface Env {
  AI: any;
  VECTOR_INDEX: any;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const { prompt } = (await context.request.json()) as { prompt: string };

    const piiRegex = /\b(\d{3}-\d{2}-\d{4}|\d{13,16}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
    if (piiRegex.test(prompt)) {
      return new Response("Request blocked: Sensitive PII detected.", { status: 403 });
    }

    const embeddings = await context.env.AI.run("@cf/baai/bge-small-en-v1.5", { text: [prompt] });
    
    const vectorQuery = await context.env.VECTOR_INDEX.query(embeddings.data[0], { topK: 1 });

    if (!vectorQuery.matches.length || vectorQuery.matches[0].score < 0.70) {
      return new Response("I do not have access to that information in Satyajit's verified portfolio.", { status: 200 });
    }

    const systemInstruction = `You are Satyajit's portfolio AI. Answer using ONLY this context: ${vectorQuery.matches[0].id}. Do not hallucinate.`;

    const aiResponse = await context.env.AI.run("@cf/meta/llama-3.2-1b-instruct", {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      stream: true,
      temperature: 0.0,
      max_tokens: 256
    });

    return new Response(aiResponse, { 
      headers: { "Content-Type": "text/event-stream" } 
    });

  } catch (error) {
    return new Response("Internal Edge Error", { status: 500 });
  }
};