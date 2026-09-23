'use client'

import type { Locale } from '@/lib/locale'
import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import MermaidRenderer from './mermaid-renderer'

export interface MissionNote {
  slug: string
  title: string
  date: string
  dateIso: string
  contentHtml: string
  ai: boolean
}

const POSES = [-2.4, 1.8, -1.2, 2.1, -1.7, 1.1]
const copy = {
  zh: { open: '阅读随记', close: '收起随记', ai: 'AI 辅助', board: '随记便签板' },
  en: { open: 'Read note', close: 'Put note back', ai: 'AI-assisted', board: 'Notes board' },
} as const

type PaperRect = { left: number; top: number; width: number; height: number; rotate: number }
type Selection = {
  note: MissionNote
  index: number
  source: HTMLButtonElement
  origin: PaperRect
  shadow: string
  target: PaperRect
  reduced: boolean
}

function paperRect(element: HTMLElement): PaperRect {
  const rect = element.getBoundingClientRect()
  const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
  return {
    left: rect.left + rect.width / 2 - element.offsetWidth / 2,
    top: rect.top + rect.height / 2 - element.offsetHeight / 2,
    width: element.offsetWidth,
    height: element.offsetHeight,
    rotate: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
  }
}

function readingRect(): PaperRect {
  const inset = window.innerWidth < 600 ? 12 : 32
  const width = Math.min(720, window.innerWidth - inset * 2)
  const height = Math.min(820, window.innerHeight - inset * 2)
  return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height, rotate: 0 }
}

function Handwriting() {
  return (
    <svg className="note-handwriting" viewBox="0 0 240 94" fill="none" aria-hidden="true">
      <path d="M3 11q9-6 13 0t13-1 16 1 12-2 18 1 13-1 18 2 13-1 17 1 16-2 20 1 17-1 18 1" />
      <path d="M2 34q8-5 14 0t16-1 12 1 17-1 12 2 17-2 15 1 17-1 15 2 12-2 16 1 15-1" />
      <path d="M4 57q8-5 13 0t17-1 13 1 16-2 16 2 14-1 18 1 12-1 18 1 14-2 18 2 12-1 13 1" />
      <path d="M3 80q9-5 14 0t13-1 17 1 14-2 17 2 13-1 18 1" />
    </svg>
  )
}

function NoteReader({ selection, locale, onClosed }: { selection: Selection; locale: Locale; onClosed: () => void }) {
  const { note, source, origin, reduced } = selection
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [target, setTarget] = useState(selection.target)
  const [returnTo, setReturnTo] = useState(origin)
  const [returnShadow, setReturnShadow] = useState(selection.shadow)
  const [closing, setClosing] = useState(false)
  const [settled, setSettled] = useState(false)
  const t = copy[locale]

  const close = () => {
    if (closing) return
    // Re-measure the real slot: resizing the viewport can move the original note.
    setReturnTo(source.isConnected ? paperRect(source) : origin)
    setReturnShadow(source.isConnected ? getComputedStyle(source).boxShadow : selection.shadow)
    setClosing(true)
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current!
    const body = document.body
    const scrollY = window.scrollY
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gutter = window.innerWidth - document.documentElement.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden', paddingRight: `${padding + gutter}px` })
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    const resize = () => setTarget(readingRect())
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      dialog.close()
      Object.assign(body.style, previous)
      window.scrollTo({ top: scrollY, behavior: 'instant' })
    }
  }, [source])

  const duration = reduced ? 0.12 : closing ? 0.36 : 0.46

  return (
    <dialog
      ref={dialogRef}
      className="note-dialog"
      aria-labelledby="note-reader-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
    >
      <motion.div className="note-shade" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration }} />
      <motion.article
        className="note-paper note-reader"
        data-paper={selection.index % 3}
        data-closing={closing || undefined}
        data-state={closing ? 'closing' : settled ? 'open' : 'opening'}
        initial={reduced ? { ...target, opacity: 0 } : { ...origin, boxShadow: selection.shadow }}
        animate={{
          ...(closing ? (reduced ? target : returnTo) : target),
          opacity: reduced && closing ? 0 : 1,
          boxShadow: closing ? returnShadow : '0px 18px 70px 0px rgba(12,22,12,0.25), 0px 3px 8px 0px rgba(12,22,12,0.19)',
        }}
        transition={{ duration, ease: [0.22, 0.8, 0.25, 1] }}
        onAnimationComplete={() => { if (closing) onClosed(); else setSettled(true) }}
      >
        <span className="note-tape" aria-hidden="true" />
        <motion.button
          ref={closeRef} type="button" className="note-close" onClick={close} aria-label={t.close}
          initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }}
          transition={{ duration: 0.12, delay: closing || reduced ? 0 : 0.2 }}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </motion.button>
        <motion.h2
          id="note-reader-title" className="note-title" style={{ width: target.width - 54 }}
          initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }}
          transition={{ duration: closing ? 0.1 : 0.22, delay: closing || reduced ? 0 : 0.12 }}
        >{note.title}</motion.h2>
        <div className="note-reading-area">
          <motion.div
            className="note-reading-scroll" tabIndex={0} aria-label={note.title}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: closing ? 0 : 1, y: 0 }}
            transition={{ duration: closing ? 0.1 : 0.24, delay: closing || reduced ? 0 : 0.18 }}
          >
            {settled && /language-mermaid/.test(note.contentHtml)
              ? <MermaidRenderer html={note.contentHtml} />
              : <div className="prose prose-y max-w-none" dangerouslySetInnerHTML={{ __html: note.contentHtml }} />}
          </motion.div>
        </div>
        <motion.div
          className="note-card-face" aria-hidden="true" style={{ width: (closing ? returnTo.width : origin.width) - 54 }}
          initial={{ opacity: reduced ? 0 : 1 }} animate={{ opacity: closing && !reduced ? 1 : 0 }}
          transition={{ duration: 0.1, delay: closing && !reduced ? 0.23 : 0 }}
        >
          <strong className="note-title">{note.title}</strong>
          <Handwriting />
        </motion.div>
        <div className="note-reader-meta">
          <time dateTime={note.dateIso}>{note.date}</time>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: 0.1, delay: closing || reduced ? 0 : 0.3 }}>
            {note.ai ? t.ai : ''}
          </motion.span>
        </div>
      </motion.article>
    </dialog>
  )
}

export function MissionBoard({ notes, locale }: { notes: MissionNote[]; locale: Locale }) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const lastSourceRef = useRef<HTMLButtonElement | null>(null)
  const t = copy[locale]
  useEffect(() => {
    // Restore after the dialog unmounts and the source card is visible again.
    if (!selection) lastSourceRef.current?.focus({ preventScroll: true })
  }, [selection])
  return (
    <>
      <section className="felt-board" aria-label={t.board}>
        <ul className="felt-notes">
          {notes.map((note, index) => (
            <li key={note.slug} style={{ '--note-angle': `${POSES[index % POSES.length]}deg` } as CSSProperties}>
              <button
                type="button" className="note-paper note-card" data-paper={index % 3}
                data-selected={selection?.note.slug === note.slug || undefined}
                aria-label={`${t.open}: ${note.title}`} aria-haspopup="dialog"
                onClick={(event) => {
                  const source = event.currentTarget
                  lastSourceRef.current = source
                  setSelection({ note, index, source, origin: paperRect(source), shadow: getComputedStyle(source).boxShadow, target: readingRect(), reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches })
                }}
              >
                <span className="note-tape" aria-hidden="true" />
                <strong className="note-title">{note.title}</strong>
                <Handwriting />
                <time className="note-date" dateTime={note.dateIso}>{note.date}</time>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {selection ? <NoteReader selection={selection} locale={locale} onClosed={() => setSelection(null)} /> : null}
    </>
  )
}
