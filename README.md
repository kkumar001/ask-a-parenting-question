# QuickAsk

A warm, chat-style web app where parents can ask about their child's health, sleep, feeding, or development and receive instant, empathetic guidance.

## Important

QuickAsk is **not** a substitute for professional medical care. Always consult a qualified clinician for health concerns.

## Setup

```bash
npm install
cp .env.example .env
```

Add one key to `.env`:

- `GROQ_API_KEY=...` (free: [console.groq.com](https://console.groq.com/))
- or `OPENAI_API_KEY=...`

Restart `npm run dev`. Header shows **AI answers on** when a key is loaded.

## Deploy on Vercel

Local `.env` is **not** used on Vercel. You must add the key in the dashboard:

1. Vercel → your project → **Settings → Environment Variables**
2. Add `GROQ_API_KEY` (or `OPENAI_API_KEY`) for Production + Preview
3. **Redeploy**

After that, production should show **AI answers on** instead of **Demo answers**.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
