# QuickAsk

A warm, chat-style web app where parents can ask about their child's health, sleep, feeding, or development and receive instant, empathetic guidance.

## Important

QuickAsk is **not** a substitute for professional medical care. Always consult a qualified clinician for health concerns.

## Setup

```bash
npm install
```

### Enable real AI answers (recommended)

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Add **one** API key:

- **Groq** (free tier): get a key at [console.groq.com](https://console.groq.com/) and set `GROQ_API_KEY=...`
- **OpenAI**: set `OPENAI_API_KEY=...`

3. Restart the dev server.

Without a key, QuickAsk still works using built-in demo answers. The header shows **AI answers on** when a key is loaded, or **Demo answers** otherwise.

## Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

`vite preview` also serves the `/api/ask` route so AI keeps working after build.
