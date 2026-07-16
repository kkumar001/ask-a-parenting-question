import { resolveProvider } from '../../server/llm'

export const config = {
  runtime: 'edge',
}

export default async function handler() {
  const provider = resolveProvider({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
  })

  return Response.json({
    ready: Boolean(provider),
    provider: provider?.provider ?? null,
  })
}
