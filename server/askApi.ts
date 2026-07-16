import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  buildChatBody,
  resolveProvider,
  sseToTextStream,
} from './llm.ts'

type AskBody = {
  question?: string
  age?: string
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

  const provider = resolveProvider(env)
  if (!provider) {
    sendJson(res, 503, {
      error: 'missing_api_key',
      message:
        'Add GROQ_API_KEY or OPENAI_API_KEY to a .env file in the project root.',
      fallback: true,
    })
    return
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
  res.setHeader('X-AI-Provider', provider.provider)
  res.setHeader('X-AI-Model', provider.model)

  const textStream = sseToTextStream(upstream.body)
  const reader = textStream.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  } catch {
    if (!res.writableEnded) res.end()
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
      const provider = resolveProvider(env)
      sendJson(res, 200, {
        ready: Boolean(provider),
        provider: provider?.provider ?? null,
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
