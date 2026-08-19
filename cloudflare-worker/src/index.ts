type WorkerAiResult = {
  response?: unknown;
};

type WorkerAiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<WorkerAiResult>;
};

export interface Env {
  AI: WorkerAiBinding;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=UTF-8',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: corsHeaders, status });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    if (request.method !== 'POST' || !['/ai', '/api/ia'].includes(url.pathname)) {
      return json({ error: 'Utilise POST /ai ou /api/ia.' }, 405);
    }

    try {
      const body = (await request.json()) as { prompt?: unknown };
      const prompt = body.prompt;

      if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 3_000) {
        return json({ error: 'Prompt invalide.' }, 400);
      }

      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt,
        max_tokens: 120,
        temperature: 0.9,
      });

      const text = typeof result.response === 'string' ? result.response.trim() : '';
      if (!text) return json({ error: 'Root n’a pas trouvé de réponse.' }, 502);

      return json({ text });
    } catch (error) {
      console.error('Erreur Workers AI', error);
      return json({ error: 'Le serveur de Root est indisponible.' }, 500);
    }
  },
};
