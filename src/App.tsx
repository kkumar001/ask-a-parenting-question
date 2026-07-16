import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  AGE_LABELS,
  AGE_OPTIONS,
  SUGGESTED_QUESTIONS,
  type AdviceCategory,
  type AgeRange,
  detectCategory,
} from './advice'
import { fetchAskStatus, streamAdvice } from './api'
import './App.css'

type Role = 'user' | 'assistant'

type Message = {
  id: string
  role: Role
  content: string
  category?: AdviceCategory
  age?: AgeRange
  streaming?: boolean
  thinking?: boolean
  answerReady?: boolean
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const categoryLabels: Record<AdviceCategory, string> = {
  sleep: 'Sleep',
  feeding: 'Feeding',
  health: 'Health',
  development: 'Development',
  general: 'Guidance',
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [age, setAge] = useState<AgeRange | ''>('')
  const [busy, setBusy] = useState(false)
  const [aiReady, setAiReady] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    void fetchAskStatus().then((status) => setAiReady(status.ready))
  }, [])

  async function ask(question: string, ageOverride?: AgeRange) {
    const trimmed = question.trim()
    const selectedAge = ageOverride ?? (age || null)
    if (!trimmed || busy || !selectedAge) return

    if (!age) setAge(selectedAge)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content: trimmed,
      age: selectedAge,
    }
    const assistantId = uid()
    const category = detectCategory(trimmed)

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        category,
        age: selectedAge,
        streaming: true,
        thinking: true,
        answerReady: false,
      },
    ])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setBusy(true)

    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, thinking: false, answerReady: true }
            : m,
        ),
      )
    }

    try {
      await streamAdvice(
        trimmed,
        selectedAge,
        (partial) => {
          reveal()
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: partial } : m,
            ),
          )
        },
        controller.signal,
      )
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        reveal()
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    'Sorry — I could not reach the advice service just now. Please try again in a moment.',
                }
              : m,
          ),
        )
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, streaming: false, thinking: false }
            : m,
        ),
      )
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void ask(input)
    }
  }

  const empty = messages.length === 0
  const chipAge: AgeRange = age || 'infant'
  const chips = SUGGESTED_QUESTIONS[chipAge]
  const canSend = Boolean(age) && Boolean(input.trim()) && !busy

  return (
    <div className="app">
      <div className="bg-glow bg-glow--blue" aria-hidden="true" />
      <div className="bg-glow bg-glow--pink" aria-hidden="true" />

      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="36" height="36">
              <rect width="40" height="40" rx="12" fill="currentColor" />
              <path
                d="M10 15.5c0-3.04 2.69-5.5 6-5.5h8c3.31 0 6 2.46 6 5.5v6c0 3.04-2.69 5.5-6 5.5h-1.4l-3.4 3.3c-.5.48-1.2.12-1.2-.58V27h-2c-3.31 0-6-2.46-6-5.5v-6z"
                fill="#FBF7F2"
              />
              <circle cx="17" cy="18.5" r="1.5" fill="currentColor" />
              <circle cx="23" cy="18.5" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <div className="brand-text">
            <h1 className="brand-name">QuickAsk</h1>
            <p className="brand-tagline">Gentle guidance for parents</p>
          </div>
        </div>
        <p className={`ai-status ${aiReady ? 'ai-status--live' : 'ai-status--local'}`}>
          {aiReady ? 'AI answers on' : 'Demo answers'}
        </p>
      </header>

      <aside className="disclaimer" role="note">
        <strong>Important:</strong> QuickAsk offers general parenting information
        styled as pediatric-style advice. It is <em>not</em> a substitute for
        professional medical care, diagnosis, or treatment. For emergencies or
        concerns about your child&apos;s health, contact a doctor or local
        emergency services right away.
      </aside>

      <main className="chat-shell">
        <div className="age-bar">
          <label className="age-label" htmlFor="age-range">
            Child&apos;s age
          </label>
          <div className="age-select-wrap">
            <select
              id="age-range"
              className="age-select"
              value={age}
              onChange={(e) => setAge(e.target.value as AgeRange | '')}
              disabled={busy}
            >
              <option value="" disabled>
                Select age range…
              </option>
              {AGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.hint})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chat-panel" ref={listRef}>
          {empty ? (
            <section className="welcome" aria-label="Welcome">
              <h2 className="welcome-title">What&apos;s on your mind?</h2>
              <p className="welcome-copy">
                {age
                  ? `Ask about your ${AGE_LABELS[age]}'s health, sleep, feeding, or development — or tap a suggestion below.`
                  : 'Choose your child’s age range above, then tap a suggestion or type your own question.'}
              </p>
            </section>
          ) : (
            <ul className="messages" aria-live="polite">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`message message--${m.role}`}
                >
                  {m.role === 'assistant' && (
                    <div className="message-meta">
                      {m.age && (
                        <span className="badge badge--age">
                          {AGE_OPTIONS.find((o) => o.value === m.age)?.label}
                        </span>
                      )}
                      {m.category && (
                        <span className={`badge badge--${m.category}`}>
                          {categoryLabels[m.category]}
                        </span>
                      )}
                    </div>
                  )}
                  {m.role === 'user' && m.age && (
                    <span className="badge badge--age-user">
                      {AGE_OPTIONS.find((o) => o.value === m.age)?.label}
                    </span>
                  )}
                  <div
                    className={[
                      'bubble',
                      m.role === 'assistant' && m.thinking
                        ? 'bubble--thinking'
                        : '',
                      m.role === 'assistant' && m.answerReady
                        ? 'bubble--fade-in'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {m.thinking ? (
                      <div className="thinking" aria-label="Thinking">
                        <span className="thinking-orbit" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="thinking-label">Thinking…</span>
                      </div>
                    ) : (
                      <>
                        {m.content
                          ? m.content.split('\n').map((line, i) =>
                              line ? (
                                <p key={i}>{line}</p>
                              ) : (
                                <br key={i} />
                              ),
                            )
                          : null}
                        {m.streaming && m.content ? (
                          <span className="cursor" aria-hidden="true" />
                        ) : null}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="composer" onSubmit={onSubmit}>
          <div className="chip-row" aria-label="Suggested questions">
            {chips.map((q) => (
              <button
                key={q}
                type="button"
                className="chip"
                onClick={() => void ask(q, chipAge)}
                disabled={busy}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="composer-row">
            <label className="sr-only" htmlFor="question">
              Ask a parenting question
            </label>
            <textarea
              id="question"
              ref={inputRef}
              className="composer-input"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
              onKeyDown={onKeyDown}
              placeholder={
                age
                  ? `Ask about your ${AGE_LABELS[age]}…`
                  : 'Select an age range first, then ask…'
              }
              disabled={busy || !age}
              maxLength={800}
            />
            <button
              type="submit"
              className="composer-send"
              disabled={!canSend}
              aria-label="Send question"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3.4 20.6 21 12 3.4 3.4l-.1 6.7L14 12 3.3 13.9l.1 6.7z"
                />
              </svg>
            </button>
          </div>
        </form>
      </main>

      <footer className="footer">
        <p>
          Built with care for curious parents · Not medical advice
        </p>
      </footer>
    </div>
  )
}
