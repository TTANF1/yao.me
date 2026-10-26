'use client'

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import type { Locale } from '@/lib/locale'
import type { Messages } from '@/lib/messages'
import type { PublicSource, SupportStatus } from '@/lib/support/types'
import styles from './support-chat.module.css'

type SupportLabels = Messages['support']

type ChatEntry = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: PublicSource[]
  followups?: string[]
  status?: SupportStatus
  sourcesOpen?: boolean
  error?: boolean
}

type ApiResponse = {
  sessionId?: string
  answer?: string
  status?: SupportStatus
  sources?: PublicSource[]
  followups?: string[]
  error?: { code?: string }
}

function InlineText({
  text,
  onCitation,
}: {
  text: string
  onCitation: (n: number) => void
}) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={index}>{part.slice(1, -1)}</code>
        }
        const citation = /^\[(\d+)\]$/.exec(part)
        if (citation) {
          const n = Number(citation[1])
          return (
            <button
              key={index}
              type="button"
              className={styles.citation}
              onClick={() => onCitation(n)}
              aria-label={`source ${n}`}
            >
              {n}
            </button>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function SourceList({
  entry,
  labels,
  onToggle,
}: {
  entry: ChatEntry
  labels: SupportLabels
  onToggle: () => void
}) {
  const sources = entry.sources ?? []
  if (sources.length === 0) return null
  return (
    <div className={styles.sources}>
      <button type="button" className={styles.sourcesToggle} onClick={onToggle} aria-expanded={Boolean(entry.sourcesOpen)}>
        {labels.sources} · {sources.length}
        <span aria-hidden="true">{entry.sourcesOpen ? '−' : '+'}</span>
      </button>
      {entry.sourcesOpen ? (
        <div className={styles.sourceList}>
          {sources.map((source) => (
            <article
              key={`${entry.id}-${source.n}`}
              id={`support-source-${entry.id}-${source.n}`}
              className={styles.source}
            >
              <div className={styles.sourceTitle}>
                <span className={styles.sourceNumber}>{source.n}</span>
                {source.title}
                {source.heading ? <span className={styles.sourceHeading}> · {source.heading}</span> : null}
              </div>
              <div className={styles.sourceMeta}>
                {source.path}:{source.startLine}-{source.endLine}
              </div>
              <p className={styles.sourceExcerpt}>{source.excerpt}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function SupportChat({ locale, labels }: { locale: Locale; labels: SupportLabels }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChatEntry[]>([
    { id: 'welcome', role: 'assistant', content: labels.welcome },
  ])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const requestRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const counterRef = useRef(0)

  useEffect(() => {
    if (!open) return
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [entries, pending, open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  function nextId() {
    counterRef.current += 1
    return `m${counterRef.current}`
  }

  function openPanel() {
    setOpen(true)
  }

  function closePanel() {
    setOpen(false)
    window.setTimeout(() => launcherRef.current?.focus(), 80)
  }

  function clearChat() {
    requestRef.current?.abort()
    requestRef.current = null
    setSessionId(undefined)
    setEntries([{ id: nextId(), role: 'assistant', content: labels.welcome }])
    setInput('')
    setPending(false)
  }

  function toggleSources(id: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, sourcesOpen: !entry.sourcesOpen } : entry,
      ),
    )
  }

  function jumpToSource(entryId: string, n: number) {
    setEntries((current) =>
      current.map((entry) => (entry.id === entryId ? { ...entry, sourcesOpen: true } : entry)),
    )
    window.setTimeout(() => {
      document.getElementById(`support-source-${entryId}-${n}`)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }, 30)
  }

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || pending || requestRef.current) return
    const controller = new AbortController()
    requestRef.current = controller
    const userEntry: ChatEntry = { id: nextId(), role: 'user', content: text }
    setEntries((current) => [...current, userEntry])
    setInput('')
    setPending(true)
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, locale }),
        signal: controller.signal,
      })
      const payload = (await response.json().catch(() => null)) as ApiResponse | null
      if (requestRef.current !== controller || controller.signal.aborted) return
      if (!response.ok || !payload?.answer || !payload.sessionId) {
        throw new Error(payload?.error?.code ?? `http_${response.status}`)
      }
      setSessionId(payload.sessionId)
      setEntries((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          content: payload.answer ?? labels.error,
          sources: payload.sources ?? [],
          followups: payload.followups ?? [],
          status: payload.status,
        },
      ])
    } catch {
      if (requestRef.current !== controller || controller.signal.aborted) return
      setEntries((current) => [
        ...current,
        { id: nextId(), role: 'assistant', content: labels.error, error: true },
      ])
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setPending(false)
        window.setTimeout(() => inputRef.current?.focus(), 30)
      }
    }
  }

  function onComposerKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(input)
    }
  }

  const hasUserMessage = entries.some((entry) => entry.role === 'user')

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherHidden : ''}`}
        onClick={openPanel}
        aria-label={labels.launcher}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.7-.8L4 20l1.1-4.1a8.1 8.1 0 0 1-1.6-4.9A8.4 8.4 0 0 1 12 2.7a8.4 8.4 0 0 1 9 8.8Z" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </svg>
        <span className={styles.launcherLabel}>{labels.launcher}</span>
      </button>

      {open ? (
        <section className={styles.panel} role="dialog" aria-label={labels.title} aria-modal="false">
          <header className={styles.head}>
            <div className={styles.brand}>
              <span className={styles.statusDot} aria-hidden="true" />
              <div className={styles.brandText}>
                <strong>{labels.title}</strong>
                <span>{labels.subtitle}</span>
              </div>
            </div>
            <div className={styles.headActions}>
              <button type="button" className={styles.iconButton} onClick={clearChat}>
                {labels.clear}
              </button>
              <button type="button" className={styles.iconButton} onClick={closePanel} aria-label={labels.close}>
                ×
              </button>
            </div>
          </header>

          <div className={styles.messages} ref={listRef} aria-live="polite">
            {entries.map((entry, index) => (
              <div key={entry.id} className={`${styles.message} ${entry.role === 'user' ? styles.user : styles.assistant}`}>
                <div className={`${styles.bubble} ${entry.error ? styles.errorBubble : ''}`}>
                  <InlineText text={entry.content} onCitation={(n) => jumpToSource(entry.id, n)} />
                </div>
                {entry.role === 'assistant' && entry.sources && entry.sources.length > 0 ? (
                  <SourceList entry={entry} labels={labels} onToggle={() => toggleSources(entry.id)} />
                ) : null}
                {entry.role === 'assistant' && entry.followups && entry.followups.length > 0 ? (
                  <div className={styles.followups}>
                    {entry.followups.slice(0, 3).map((followup) => (
                      <button key={followup} type="button" className={styles.chip} onClick={() => void send(followup)}>
                        {followup}
                      </button>
                    ))}
                  </div>
                ) : null}
                {index === 0 && !hasUserMessage ? (
                  <div className={styles.suggestions}>
                    {labels.suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" className={styles.chip} onClick={() => void send(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {pending ? (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={`${styles.bubble} ${styles.typing}`} aria-label={labels.thinking}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.footer}>
            <form
              className={styles.composer}
              onSubmit={(event) => {
                event.preventDefault()
                void send(input)
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder={labels.placeholder}
                maxLength={2000}
                rows={1}
                disabled={pending}
                aria-label={labels.placeholder}
              />
              <button type="submit" disabled={pending || !input.trim()}>
                {labels.send}
              </button>
            </form>
            <p className={styles.disclaimer}>{labels.disclaimer}</p>
          </div>
        </section>
      ) : null}
    </>
  )
}
