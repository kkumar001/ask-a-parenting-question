import {
  buildChatBody,
  resolveProvider,
  sseToTextStream,
} from '../server/llm'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let body: { question?: string; age?: string }
  try {
    body = (await req.json()) as { question?: string; age?: string }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const question = body.question?.trim() ?? ''
  const age = body.age?.trim() ?? ''
  if (!question || !age) {
    return Response.json(
      { error: 'question and age are required' },
      { status: 400 },
    )
  }

  const provider = resolveProvider({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
  })

  if (!provider) {
    return Response.json(
      {
        error: 'missing_api_key',
        message:
          'Add GROQ_API_KEY or OPENAI_API_KEY in the Vercel project Environment Variables.',
        fallback: true,
      },
      { status: 503 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildChatBody(question, age, provider.model)),
    })
  } catch {
    return Response.json(
      { error: 'upstream_unreachable', fallback: true },
      { status: 502 },
    )
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    return Response.json(
      {
        error: 'upstream_error',
        status: upstream.status,
        detail: detail.slice(0, 300),
        fallback: true,
      },
      { status: 502 },
    )
  }

  return new Response(sseToTextStream(upstream.body), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-AI-Provider': provider.provider,
      'X-AI-Model': provider.model,
    },
  })
}
