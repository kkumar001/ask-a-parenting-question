import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type AskBody = {
  question?: string
  age?: string
}

const AGE_HINTS: Record<string, string> = {
  newborn: 'newborn (0-3 months)',
  infant: 'infant (3-12 months)',
  toddler: 'toddler (1-3 years)',
  preschooler: 'preschooler (3-5 years)',
}

function systemPrompt(age: string) {
  const stage = AGE_HINTS[age] ?? age
  return `You are QuickAsk, a warm, empathetic parenting guide who answers like a thoughtful pediatric nurse or parenting coach — never claiming to be a doctor.

Tone: calm, reassuring, practical, and specific to a ${stage}.
Structure: 2-4 short paragraphs. Lead with empathy, then clear guidance, then when to contact a clinician.
Rules:
- Tailor every tip to the ${stage} stage (do not give toddler advice for a newborn, etc.).
- Never diagnose or prescribe medication doses.
- For urgent red flags (difficulty breathing, unresponsiveness, newborn fever ≥100.4°F/38°C, severe dehydration), say to seek emergency care or call a doctor now.
- End with a brief reminder that this is general guidance, not a substitute for professional medical care.
- Keep the total reply under 220 words. No markdown headings or bullet lists unless truly helpful; prefer short paragraphs.`
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: Record<string, unknown>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function handleAsk(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
) {
  let body: AskBody
  try {
    body = JSON.parse(await readBody(req)) as AskBody
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' })
    return
  }

  const question = body.question?.trim() ?? ''
  const age = body.age?.trim() ?? ''
  if (!question || !age) {
    sendJson(res, 400, { error: 'question and age are required' })
    return
  }

  const groqKey = env.GROQ_API_KEY?.trim()
  const openaiKey = env.OPENAI_API_KEY?.trim()
  const apiKey = groqKey || openaiKey

  if (!apiKey) {
    sendJson(res, 503, {
      error: 'missing_api_key',
      message:
        'Add GROQ_API_KEY or OPENAI_API_KEY to a .env file in the project root.',
      fallback: true,
    })
    return
  }

  const provider = groqKey ? 'groq' : 'openai'
  const baseUrl =
    provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : 'https://api.openai.com/v1'
  const model =
    env.AI_MODEL?.trim() ||
    (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini')

  let upstream: Response
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: 'system', content: systemPrompt(age) },
          {
            role: 'user',
            content: `Child's age range: ${AGE_HINTS[age] ?? age}\n\nParent question: ${question}`,
          },
        ],
      }),
    })
  } catch {
    sendJson(res, 502, { error: 'upstream_unreachable', fallback: true })
    return
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    sendJson(res, 502, {
      error: 'upstream_error',
      status: upstream.status,
      detail: detail.slice(0, 300),
      fallback: true,
    })
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-AI-Provider', provider)
  res.setHeader('X-AI-Model', model)

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[]
          }
          const token = parsed.choices?.[0]?.delta?.content
          if (token) res.write(token)
        } catch {
          // skip malformed SSE chunks
        }
      }
    }
  } catch {
    if (!res.writableEnded) {
      res.end()
    }
    return
  }

  res.end()
}

export function askApiPlugin(env: Record<string, string>): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split('?')[0]
    if (req.method === 'POST' && url === '/api/ask') {
      void handleAsk(req, res, env)
      return
    }
    if (req.method === 'GET' && url === '/api/ask/status') {
      const ready = Boolean(env.GROQ_API_KEY?.trim() || env.OPENAI_API_KEY?.trim())
      sendJson(res, 200, {
        ready,
        provider: env.GROQ_API_KEY?.trim()
          ? 'groq'
          : env.OPENAI_API_KEY?.trim()
            ? 'openai'
            : null,
      })
      return
    }
    next()
  }

  return {
    name: 'quickask-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
