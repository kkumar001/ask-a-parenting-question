/// <reference types="node" />
import { resolveProvider } from '../../server/llm.js'

export const config = {
  runtime: 'edge',
}

function env(name: string): string | undefined {
  return process.env[name]
}

export default async function handler() {
  const provider = resolveProvider({
    GROQ_API_KEY: env('GROQ_API_KEY'),
    OPENAI_API_KEY: env('OPENAI_API_KEY'),
    AI_MODEL: env('AI_MODEL'),
  })

  return Response.json({
    ready: Boolean(provider),
    provider: provider?.provider ?? null,
  })
}
