import { generateAdvice, type AgeRange } from './advice'

export type AskStatus = {
  ready: boolean
  provider: 'groq' | 'openai' | null
}

export async function fetchAskStatus(): Promise<AskStatus> {
  try {
    const res = await fetch('/api/ask/status')
    if (!res.ok) return { ready: false, provider: null }
    return (await res.json()) as AskStatus
  } catch {
    return { ready: false, provider: null }
  }
}

/**
 * Streams an AI answer from /api/ask.
 * Falls back to local template advice if no API key is configured.
 */
export async function streamAdvice(
  question: string,
  age: AgeRange,
  onUpdate: (partial: string) => void,
  signal: AbortSignal,
): Promise<'ai' | 'local'> {
  let res: Response
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, age }),
      signal,
    })
  } catch {
    if (signal.aborted) return 'local'
    await streamLocal(question, age, onUpdate, signal)
    return 'local'
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (!res.ok || contentType.includes('application/json')) {
    await streamLocal(question, age, onUpdate, signal)
    return 'local'
  }

  if (!res.body) {
    await streamLocal(question, age, onUpdate, signal)
    return 'local'
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let built = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (signal.aborted) {
      await reader.cancel().catch(() => undefined)
      return 'ai'
    }
    built += decoder.decode(value, { stream: true })
    onUpdate(built)
  }

  if (!built.trim()) {
    await streamLocal(question, age, onUpdate, signal)
    return 'local'
  }

  return 'ai'
}

async function streamLocal(
  question: string,
  age: AgeRange,
  onUpdate: (partial: string) => void,
  signal: AbortSignal,
) {
  const full = generateAdvice(question, age)
  const words = full.split(/(\s+)/)
  let built = ''
  for (const word of words) {
    if (signal.aborted) return
    built += word
    onUpdate(built)
    await new Promise((r) => setTimeout(r, 16 + Math.random() * 24))
  }
}
