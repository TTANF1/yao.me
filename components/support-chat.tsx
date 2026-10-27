'use client'

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import type { Locale } from '@/lib/locale'
import type { Messages } from '@/lib/messages'
import type { PublicSource, SupportStatus, SupportApiResponse } from '@/lib/support/types'
import { readServerEvents } from '@/lib/support/sse'
import { sourceSummary } from '@/lib/support/source'
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
  streaming?: boolean
}

function AssistantMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 3 2.5 9.5L28 10l-7 7 7 5-10-1-2 9-3-10-9 3 7-7-7-5 10 1Z" fill="currentColor" />
    </svg>
  )
}

function CopyAnswer({ content, labels }: { content: string; labels: SupportLabels }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return (
    <button type="button" className={styles.copyButton} aria-label={copied ? labels.copied : labels.copy} title={copied ? labels.copied : labels.copy} onClick={async () => {
      try {
        await navigator.clipboard.writeText(content)
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1800)
      } catch { /* Clipboard may be unavailable; keep the answer selectable. */ }
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {copied ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></>}
      </svg>
      {copied ? <span>{labels.copied}</span> : null}
    </button>
  )
}

function InlineText({
  text,
  onCitation,
}: {
  text: string
  onCitation: (n: number) => void
}) {
  return text.split('\n').map((line, index) => (
    <span key={index} className={styles.answerLine}>
      {index > 0 ? '\n' : null}
      <InlineLine text={line} onCitation={onCitation} />
    </span>
  ))
}

function InlineLine({ text, onCitation }: { text: string; onCitation: (n: number) => void }) {
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
        <ul className={styles.sourceList}>
          {sources.map((source) => {
            const { url, title, description } = sourceSummary(source)
            return (
              <li
                key={`${entry.id}-${source.n}`}
                id={`support-source-${entry.id}-${source.n}`}
                className={styles.source}
                title={`${source.title}：${description}\n${source.path}:${source.startLine}-${source.endLine}`}
              >
                <span className={styles.sourceNumber}>{source.n}</span>
                <span className={styles.sourceInfo}>
                  {url ? <a className={styles.sourceTitle} href={url} target="_blank" rel="noopener noreferrer">{title}</a> : <span className={styles.sourceTitle}>{title}</span>}
                  <span>：{description}</span>
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export function SupportChat({ locale, labels }: { locale: Locale; labels: SupportLabels }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const requestRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const counterRef = useRef(0)
  const followRef = useRef(true)
  const activeEntryRef = useRef<string | null>(null)
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const [stage, setStage] = useState('working')
  const [announcement, setAnnouncement] = useState('')
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open || !followRef.current) return
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [entries, pending, open])

  useEffect(() => {
    const node = inputRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 144)}px`
  }, [input, open])

  useEffect(() => {
    if (!open) return
    const query = window.matchMedia('(max-width: 640px)')
    const previous = document.body.style.overflow
    const hidden: HTMLElement[] = []
    const restore = () => { hidden.splice(0).forEach((node) => { node.inert = false }) }
    const sync = () => {
      restore()
      document.body.style.overflow = query.matches ? 'hidden' : previous
      panelRef.current?.setAttribute('aria-modal', String(query.matches))
      if (query.matches) {
        let branch: HTMLElement | null = panelRef.current
        while (branch && branch !== document.body) {
          for (const sibling of branch.parentElement?.children ?? []) {
            if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {
              sibling.inert = true
              hidden.push(sibling)
            }
          }
          branch = branch.parentElement
        }
      }
    }
    sync()
    query.addEventListener('change', sync)
    return () => {
      restore()
      document.body.style.overflow = previous
      query.removeEventListener('change', sync)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        window.setTimeout(() => launcherRef.current?.focus(), 80)
      }
      if (event.key === 'Tab' && window.matchMedia('(max-width: 640px)').matches) {
        const controls = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, [tabindex="0"]')
        const first = controls?.[0]
        const last = controls?.[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
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
    activeEntryRef.current = null
    setEntries([])
    setInput('')
    setPending(false)
    followRef.current = true
    setAwayFromBottom(false)
    setAnnouncement('')
    inputRef.current?.focus()
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
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    }, 30)
  }

  function stopGeneration() {
    requestRef.current?.abort()
    requestRef.current = null
    const id = activeEntryRef.current
    activeEntryRef.current = null
    // A draft has not passed final server validation; do not keep it as an answer.
    setEntries((current) => current.map((entry) => entry.id === id ? { id: entry.id, role: 'assistant', content: labels.stopped } : entry))
    setPending(false)
    setAnnouncement(labels.stopped)
    inputRef.current?.focus()
  }

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || text.length > 2000 || pending || requestRef.current) return
    const controller = new AbortController()
    requestRef.current = controller
    const id = nextId()
    activeEntryRef.current = id
    followRef.current = true
    setAwayFromBottom(false)
    setEntries((current) => [...current, { id: nextId(), role: 'user', content: text }, { id, role: 'assistant', content: '', streaming: true }])
    setInput('')
    setPending(true)
    setStage('working')
    setAnnouncement(labels.thinking)
    let receivedMessage = false
    let completed = false
    let draft = ''
    let frame: number | null = null
    let visibleLength = 0
    let previousTime = 0
    let characterBudget = 0
    let revealFinished: (() => void) | undefined
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (patch: Partial<ChatEntry>) => setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry))
    const flush = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      revealFinished?.()
      revealFinished = undefined
    }
    const reveal = (time: number) => {
      frame = null
      if (requestRef.current !== controller || controller.signal.aborted) return
      const remaining = draft.length - visibleLength
      if (motionPreference.matches || document.hidden) {
        visibleLength = draft.length
      } else {
        const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16
        // Catch up gently when a large server segment arrives, without a long tail.
        const speed = Math.max(85, Math.min(450, remaining / 1.6))
        characterBudget += elapsed * speed / 1000
        const count = Math.floor(characterBudget)
        characterBudget -= count
        visibleLength = Math.min(draft.length, visibleLength + count)
        // Keep surrogate pairs intact (emoji and other non-BMP characters).
        if (visibleLength < draft.length && /[\uD800-\uDBFF]/.test(draft[visibleLength - 1] ?? '')) visibleLength += 1
      }
      previousTime = time
      update({ content: draft.slice(0, visibleLength) })
      if (visibleLength < draft.length) frame = requestAnimationFrame(reveal)
      else {
        previousTime = 0
        characterBudget = 0
        revealFinished?.()
        revealFinished = undefined
      }
    }
    const scheduleReveal = () => {
      if (document.hidden || motionPreference.matches) {
        if (frame !== null) cancelAnimationFrame(frame)
        reveal(performance.now())
      } else if (frame === null) frame = requestAnimationFrame(reveal)
    }
    const settleHidden = () => {
      if (document.hidden || motionPreference.matches) {
        if (frame !== null) cancelAnimationFrame(frame)
        reveal(performance.now())
      }
    }
    controller.signal.addEventListener('abort', flush, { once: true })
    document.addEventListener('visibilitychange', settleHidden)
    motionPreference.addEventListener('change', settleHidden)
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message: text, sessionId, locale }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error?.code ?? 'support_unavailable')
      }
      if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream')) throw new Error('invalid_stream')
      for await (const { event, data } of readServerEvents(response.body)) {
        if (requestRef.current !== controller || controller.signal.aborted) return
        const value = data as Record<string, unknown>
        if (!value || typeof value !== 'object') throw new Error('invalid_stream')
        if (event === 'session' && typeof value.sessionId === 'string') setSessionId(value.sessionId)
        if (event === 'status' && typeof value.stage === 'string') setStage(value.stage)
        if (event === 'delta') {
          if (typeof value.text !== 'string' || receivedMessage) throw new Error('invalid_stream')
          draft += value.text
          if (draft.length > 20_000) throw new Error('invalid_stream')
          scheduleReveal()
        }
        if (event === 'message') {
          const payload = value as SupportApiResponse
          if (!payload.answer || !payload.sessionId) throw new Error('invalid_stream')
          if (receivedMessage || payload.answer.length > 20_000) throw new Error('invalid_stream')
          receivedMessage = true
          // Keep the revealed prefix when the authoritative answer matches the draft.
          let shared = 0
          while (shared < visibleLength && payload.answer[shared] === draft[shared]) shared += 1
          if (/[\uD800-\uDBFF]/.test(payload.answer[shared - 1] ?? '')) shared -= 1
          visibleLength = shared
          draft = payload.answer
          setSessionId(payload.sessionId)
          update({ content: draft.slice(0, visibleLength), sources: payload.sources, followups: payload.followups, status: payload.status })
          scheduleReveal()
        }
        if (event === 'error') throw new Error(typeof value.code === 'string' ? value.code : 'support_unavailable')
        if (event === 'done') {
          if (!receivedMessage) throw new Error('incomplete_stream')
          completed = true
          break
        }
      }
      if (!completed) throw new Error('incomplete_stream')
      if (requestRef.current !== controller || controller.signal.aborted) return
      if (visibleLength < draft.length) {
        await new Promise<void>((resolve) => {
          revealFinished = resolve
          scheduleReveal()
        })
      }
      if (requestRef.current !== controller || controller.signal.aborted) return
      update({ streaming: false })
      setAnnouncement(labels.complete)
    } catch (error) {
      if (requestRef.current !== controller || controller.signal.aborted) return
      const code = error instanceof Error ? error.message : ''
      const content = code === 'rate_limited' ? labels.rateLimited : code === 'session_unavailable' ? labels.sessionUnavailable : draft ? labels.interrupted : labels.error
      update({ content, error: true, streaming: false, sources: [], followups: [] })
      setAnnouncement(content)
    } finally {
      flush()
      controller.signal.removeEventListener('abort', flush)
      document.removeEventListener('visibilitychange', settleHidden)
      motionPreference.removeEventListener('change', settleHidden)
      if (requestRef.current === controller) {
        requestRef.current = null
        activeEntryRef.current = null
        setPending(false)
      }
    }
  }

  function onComposerKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      void send(input)
    }
  }

  const hasUserMessage = entries.some((entry) => entry.role === 'user')
  const progressLabel = stage === 'generating' ? labels.generating : labels.thinking

  function jumpLatest() {
    followRef.current = true
    setAwayFromBottom(false)
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherHidden : ''}`}
        onClick={openPanel}
        aria-label={labels.launcher}
        aria-expanded={open}
        aria-controls="support-panel"
        tabIndex={open ? -1 : 0}
      >
        <AssistantMark />
        <span className={styles.launcherLabel}>{labels.launcher}</span>
      </button>

      {open ? (
        <section id="support-panel" ref={panelRef} className={styles.panel} role="dialog" aria-label={labels.title} aria-modal="false">
          <header className={styles.head}>
            <div className={styles.brand}>
              <AssistantMark className={styles.brandMark} />
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

          <div className={styles.messages} ref={listRef} onScroll={() => {
            const node = listRef.current
            if (!node) return
            const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 64
            followRef.current = nearBottom
            setAwayFromBottom(!nearBottom)
          }}>
            {!hasUserMessage ? (
              <div className={styles.welcome}>
                <AssistantMark className={styles.welcomeMark} />
                <h2>{labels.greeting}</h2>
                <p>{labels.welcome}</p>
                <div className={styles.suggestions}>
                  {labels.suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" className={styles.chip} onClick={() => void send(suggestion)}>
                      {suggestion}<span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {entries.map((entry) => (
              <div key={entry.id} className={`${styles.message} ${entry.role === 'user' ? styles.user : styles.assistant}`}>
                {entry.role === 'assistant' ? <div className={styles.messageAuthor}><AssistantMark />{labels.title}</div> : null}
                {entry.streaming && !entry.content ? (
                  <div className={styles.typing}><span />{progressLabel}</div>
                ) : (
                  <div className={`${styles.bubble} ${entry.error ? styles.errorBubble : ''}`} data-streaming={entry.streaming || undefined}>
                    <InlineText text={entry.content} onCitation={(n) => jumpToSource(entry.id, n)} />
                    {entry.streaming ? <span className={styles.streamCursor} aria-hidden="true" /> : null}
                  </div>
                )}
                {entry.role === 'assistant' && !entry.streaming && !entry.error && entry.content && entry.status ? <CopyAnswer content={entry.content} labels={labels} /> : null}
                {entry.role === 'assistant' && !entry.streaming && entry.sources && entry.sources.length > 0 ? (
                  <SourceList entry={entry} labels={labels} onToggle={() => toggleSources(entry.id)} />
                ) : null}
                {entry.role === 'assistant' && !entry.streaming && entry.followups && entry.followups.length > 0 ? (
                  <div className={styles.followups}>
                    {entry.followups.slice(0, 3).map((followup) => (
                      <button key={followup} type="button" className={styles.chip} disabled={pending} onClick={() => void send(followup)}>
                        {followup}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <span className={styles.srOnly} role="status" aria-live="polite">{announcement}</span>
          {awayFromBottom ? <button type="button" className={styles.jumpLatest} onClick={jumpLatest}>↓ {labels.jumpLatest}</button> : null}

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
                aria-label={labels.placeholder}
              />
              <div className={styles.composerTools}>
                <span>{labels.keyboardHint}</span>
                {pending ? (
                  <button type="button" className={styles.sendButton} onClick={stopGeneration} aria-label={labels.stop} title={labels.stop}>
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="2" /></svg>
                  </button>
                ) : (
                  <button type="submit" className={styles.sendButton} disabled={!input.trim()} aria-label={labels.send} title={labels.send}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 15V4m-5 5 5-5 5 5" /></svg>
                  </button>
                )}
              </div>
            </form>
            <p className={styles.disclaimer}>{labels.disclaimer}</p>
          </div>
        </section>
      ) : null}
    </>
  )
}
