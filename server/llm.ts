export type ProviderConfig = {
  provider: 'groq' | 'openai'
  apiKey: string
  baseUrl: string
  model: string
}

export const AGE_HINTS: Record<string, string> = {
  newborn: 'newborn (0–3 months)',
  infant: 'infant (3–12 months)',
  toddler: 'toddler (1–3 years)',
  preschooler: 'preschooler (3–5 years)',
}

export function systemPrompt(age: string) {
  const stage = AGE_HINTS[age] ?? age
  return `You are QuickAsk, a warm, empathetic parenting guide who answers like a thoughtful pediatric nurse or parenting coach — never claiming to be a doctor.

Tone: calm, reassuring, practical, and specific to a ${stage}.
Structure: 2–4 short paragraphs. Lead with empathy, then clear guidance, then when to contact a clinician.
Rules:
- Tailor every tip to the ${stage} stage (do not give toddler advice for a newborn, etc.).
- Never diagnose or prescribe medication doses.
- For urgent red flags (difficulty breathing, unresponsiveness, newborn fever ≥100.4°F/38°C, severe dehydration), say to seek emergency care or call a doctor now.
- End with a brief reminder that this is general guidance, not a substitute for professional medical care.
- Keep the total reply under 220 words. No markdown headings or bullet lists unless truly helpful; prefer short paragraphs.`
}

export function resolveProvider(
  env: Record<string, string | undefined>,
): ProviderConfig | null {
  const groqKey = env.GROQ_API_KEY?.trim()
  const openaiKey = env.OPENAI_API_KEY?.trim()
  const apiKey = groqKey || openaiKey
  if (!apiKey) return null

  const provider = groqKey ? 'groq' : 'openai'
  return {
    provider,
    apiKey,
    baseUrl:
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : 'https://api.openai.com/v1',
    model:
      env.AI_MODEL?.trim() ||
      (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'),
  }
}

export function buildChatBody(question: string, age: string, model: string) {
  return {
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
  }
}

/** Convert OpenAI-style SSE into plain text tokens. */
export function sseToTextStream(upstream: ReadableStream<Uint8Array>) {
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        const encoder = new TextEncoder()

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
            if (token) controller.enqueue(encoder.encode(token))
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
    },
    cancel() {
      void reader.cancel()
    },
  })
}
