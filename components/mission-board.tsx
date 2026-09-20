'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/locale'
import { GameTransitionLink } from './game-transition-link'

export interface MissionNote {
  slug: string
  title: string
  summary: string
  date: string
  readingMinutes: number
  ai: boolean
}

const POSES = [-2.4, 1.7, -1.1, 2.8, -1.9, 1.1]

const copy = {
  zh: {
    status: '任务完成', open: '打开任务报告', close: '关闭预览', preview: '任务报告预览',
    read: '阅读完整报告', minutes: '分钟', ai: 'AI 协作',
  },
  en: {
    status: 'MISSION COMPLETE', open: 'Open mission report', close: 'Close preview', preview: 'Mission report preview',
    read: 'Read full report', minutes: 'min', ai: 'AI-assisted',
  },
} as const

export function MissionBoard({ notes, locale }: { notes: MissionNote[]; locale: Locale }) {
  const [selected, setSelected] = useState<MissionNote | null>(null)
  const t = copy[locale]

  useEffect(() => {
    if (!selected) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selected])

  return (
    <>
      <ul className="mission-board">
        {notes.map((note, index) => (
          <li key={note.slug} style={{ '--mission-rotate': `${POSES[index % POSES.length]}deg` } as CSSProperties}>
            <button type="button" className="mission-report" onClick={() => setSelected(note)} aria-label={`${t.open}: ${note.title}`}>
              <span className="mission-stamp font-pixel">{t.status}</span>
              <span className="mission-id font-pixel">REPORT // {String(index + 1).padStart(2, '0')}</span>
              <strong>{note.title}</strong>
              <span className="mission-summary">{note.summary}</span>
              <span className="mission-meta">
                <time>{note.date}</time>
                <span>{note.readingMinutes} {t.minutes}</span>
              </span>
              <span className="mission-open-mark font-pixel">＋ OPEN</span>
            </button>
            <span className="mission-pin" aria-hidden="true" />
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="mission-preview-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}
          >
            <motion.article
              role="dialog" aria-modal="true" aria-labelledby="mission-preview-title" className="mission-preview"
              initial={{ opacity: 0, scale: 0.68, rotate: -7, y: 80 }}
              animate={{ opacity: 1, scale: 1, rotate: -1, y: 0 }}
              exit={{ opacity: 0, scale: 0.78, rotate: 5, y: 60 }}
              transition={{ type: 'spring', stiffness: 270, damping: 24 }}
            >
              <span className="mission-preview-tape" aria-hidden="true" />
              <button type="button" className="mission-preview-close font-pixel" onClick={() => setSelected(null)} aria-label={t.close}>×</button>
              <p className="font-pixel">{t.preview}</p>
              <h2 id="mission-preview-title">{selected.title}</h2>
              <div className="mission-preview-rule" />
              <p>{selected.summary}</p>
              <dl>
                <div><dt>DATE</dt><dd>{selected.date}</dd></div>
                <div><dt>TIME</dt><dd>{selected.readingMinutes} {t.minutes}</dd></div>
                {selected.ai ? <div><dt>PARTY</dt><dd>{t.ai}</dd></div> : null}
              </dl>
              <GameTransitionLink href={`/${locale}/notes/${selected.slug}`} className="mission-preview-cta font-pixel">
                {t.read} <span aria-hidden="true">→</span>
              </GameTransitionLink>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
