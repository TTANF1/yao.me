'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/locale'
import { PostListLink } from './post-list-link'

export interface ArchiveEntry {
  slug: string
  title: string
  summary: string
  date: string
}

export interface ArchiveYear {
  year: string
  entries: ArchiveEntry[]
}

type OpenArchive = { year: string; pinned: boolean } | null
const POSES = [-1.4, 1.1, -0.7, 1.7, -1]

export function ClassifiedArchive({ groups, locale }: { groups: ArchiveYear[]; locale: Locale }) {
  const [opened, setOpened] = useState<OpenArchive>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copy = locale === 'zh'
    ? { level: '机密档案', files: '份文件', open: '展开档案', hint: '悬停翻阅 · 点击固定', touch: '点击年份，抽出档案', pinned: '已固定', close: '收回档案', index: '卷内目录' }
    : { level: 'CLASSIFIED', files: 'FILES', open: 'Open archive', hint: 'Hover to inspect · click to pin', touch: 'Tap a year to open its archive', pinned: 'PINNED', close: 'Close archive', index: 'FILE INDEX' }

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  const preview = (year: string) => {
    cancelClose()
    setOpened((current) => current?.pinned ? current : { year, pinned: false })
  }

  const leave = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      // Keyboard focus in the sheet keeps the same corridor open.
      if (rootRef.current?.querySelector('.classified-year[data-open]')?.contains(document.activeElement)) return
      setOpened((current) => current?.pinned ? current : null)
    }, 180)
  }

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const surface = target.closest('.classified-folder, .classified-file-list')
      if (surface && rootRef.current?.contains(surface)) return
      setOpened(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const activeYear = rootRef.current?.querySelector('.classified-year[data-open]')
      if (activeYear?.contains(document.activeElement)) {
        activeYear.querySelector<HTMLButtonElement>('.classified-folder')?.focus()
      }
      setOpened(null)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', escape)
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  const openYear = opened?.year

  // Lift the sheet only as far as the folder height, keeping the paper connected.
  useEffect(() => {
    if (!openYear) return
    const sheet = rootRef.current?.querySelector<HTMLElement>('.classified-year[data-open] .classified-file-list')
    if (!sheet) return
    const fit = () => {
      sheet.style.setProperty('--sheet-rise', '0px')
      if (window.matchMedia('(max-width: 760px)').matches) return
      const bounds = sheet.getBoundingClientRect()
      const rise = Math.min(100, Math.max(0, bounds.bottom - window.innerHeight + 24), Math.max(0, bounds.top - 90))
      sheet.style.setProperty('--sheet-rise', `${rise}px`)
    }
    const frame = requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', fit)
    }
  }, [openYear])

  return (
    <div ref={rootRef} className="classified-archive">
      <p className="classified-archive-hint">
        <span className="archive-pointer-hint">{copy.hint}</span>
        <span className="archive-touch-hint">{copy.touch}</span>
        <span aria-hidden="true">01 — {String(groups.length).padStart(2, '0')}</span>
      </p>
      <ol className="classified-stack">
        {groups.map((group, index) => {
          const open = opened?.year === group.year
          const pinned = open && opened.pinned
          const panelId = `archive-${locale}-${group.year}`
          return (
            <li
              key={group.year}
              className="classified-year"
              data-open={open || undefined}
              data-pinned={pinned || undefined}
              style={{
                '--archive-order': groups.length - index,
                '--archive-rotate': `${POSES[index % POSES.length]}deg`,
                '--archive-offset': `${[0, 16, 6, 20, 10][index % 5]}px`,
                '--archive-thickness': `${Math.min(6, group.entries.length + 1)}px`,
              } as CSSProperties}
              onPointerEnter={(event) => { if (event.pointerType === 'mouse') preview(group.year) }}
              onPointerLeave={(event) => { if (event.pointerType === 'mouse') leave() }}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) leave() }}
            >
              <button
                type="button"
                className="classified-folder"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={`${copy.open}: ${group.year}`}
                onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) preview(group.year) }}
                onClick={() => {
                  cancelClose()
                  setOpened((current) => current?.year === group.year && current.pinned ? null : { year: group.year, pinned: true })
                }}
              >
                <span className="classified-folder-back" aria-hidden="true" />
                <span className="classified-folder-paper" aria-hidden="true" />
                <span className="classified-folder-front" aria-hidden="true" />
                <span className="classified-folder-tab">{copy.level}</span>
                <span className="classified-folder-year">{group.year}</span>
                <span className="classified-folder-count">{String(group.entries.length).padStart(2, '0')} {copy.files}</span>
                <span className="classified-folder-mark" aria-hidden="true">EYES ONLY</span>
                <span className="classified-folder-pin" aria-hidden="true">{copy.pinned}</span>
              </button>

              <div className="classified-sheet-slot" inert={!open}>
                <section id={panelId} className="classified-file-list" aria-label={`${group.year} ${copy.index}`} aria-hidden={!open}>
                  <div className="classified-file-list-head">
                    <span><b>{group.year}</b> / {copy.index}</span>
                    <button type="button" aria-label={copy.close} onClick={() => {
                      rootRef.current?.querySelector<HTMLButtonElement>('.classified-year[data-open] .classified-folder')?.focus()
                      cancelClose()
                      setOpened(null)
                    }}>×</button>
                  </div>
                  <ul>
                    {group.entries.map((entry, entryIndex) => (
                      <li key={entry.slug}>
                        <PostListLink href={`/${locale}/blog/${entry.slug}`} kind="post" slug={entry.slug} className="classified-file-link">
                          <span className="classified-file-number">{String(entryIndex + 1).padStart(2, '0')}</span>
                          <span className="classified-file-copy">
                            <strong className="list-title">{entry.title}</strong>
                            <time>{entry.date}</time>
                            {entry.summary ? <span className="classified-file-summary"><small>{entry.summary}</small></span> : null}
                          </span>
                          <span className="classified-file-arrow" aria-hidden="true">↗</span>
                        </PostListLink>
                      </li>
                    ))}
                  </ul>
                  <div className="classified-file-list-foot" aria-hidden="true">
                    <span>{pinned ? copy.pinned : 'ARCHIVE / ' + group.year}</span>
                    <span>{String(group.entries.length).padStart(2, '0')} / {String(group.entries.length).padStart(2, '0')}</span>
                  </div>
                </section>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
