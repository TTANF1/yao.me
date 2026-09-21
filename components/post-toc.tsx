'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Locale } from '@/lib/locale'
import { isNavTransitionInFlight, NAV_TRANSITION_END_EVENT } from '@/lib/nav-transition'

interface TocItem { id: string; text: string; level: number }
const ROW_HEIGHT = 36
const TOC_MIN_LEFT_SPACE = 232
const FALLBACK_READING_LINE = 130

export default function PostToc({ children, locale }: { children: ReactNode; locale: Locale }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDetailsElement>(null)
  const unlockJump = useRef<ReturnType<typeof setTimeout> | null>(null)
  const jumpTarget = useRef<string | null>(null)
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [railWidth, setRailWidth] = useState(0)
  const [locked, setLocked] = useState(() => isNavTransitionInFlight())
  const captionId = useId()

  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]'))
    let frame = 0
    const update = () => {
      frame = 0
      const left = root.getBoundingClientRect().left
      setRailWidth(left >= TOC_MIN_LEFT_SPACE ? Math.min(280, left - 40) : 0)
      if (!headings.length) return
      // Keep the reading line aligned with the heading's CSS scroll target. Using
      // a separate viewport percentage made a freshly clicked heading land at
      // one position while the active-section calculation used another.
      const scrollMargin = Number.parseFloat(window.getComputedStyle(headings[0]).scrollMarginTop)
      const marker = Number.isFinite(scrollMargin) ? scrollMargin : FALLBACK_READING_LINE
      let current = headings[0]
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= marker) current = heading
        else break
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = headings[headings.length - 1]
      // A click owns the active marker until its smooth scroll settles.
      if (!jumpTarget.current) setActiveId(current.id)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const initialize = requestAnimationFrame(() => {
      setItems(headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent?.trim() ?? '',
        level: heading.tagName === 'H3' ? 3 : 2,
      })))
      update()
    })
    const cancelJump = () => {
      jumpTarget.current = null
      if (unlockJump.current) {
        clearTimeout(unlockJump.current)
        unlockJump.current = null
      }
      schedule()
    }
    const scrollEnd = () => {
      if (jumpTarget.current) cancelJump()
    }
    const resize = new ResizeObserver(schedule)
    resize.observe(root)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('scrollend', scrollEnd)
    window.addEventListener('wheel', cancelJump, { passive: true })
    window.addEventListener('touchstart', cancelJump, { passive: true })
    return () => {
      cancelAnimationFrame(initialize)
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scrollend', scrollEnd)
      window.removeEventListener('wheel', cancelJump)
      window.removeEventListener('touchstart', cancelJump)
      if (unlockJump.current) clearTimeout(unlockJump.current)
    }
  }, [locale])

  useEffect(() => {
    if (!locked) return
    const unlock = () => setLocked(false)
    window.addEventListener(NAV_TRANSITION_END_EVENT, unlock)
    const timer = window.setTimeout(unlock, 1600)
    return () => {
      window.removeEventListener(NAV_TRANSITION_END_EVENT, unlock)
      window.clearTimeout(timer)
    }
  }, [locked])

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId))
  const focusIndex = hoveredIndex ?? activeIndex

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || expanded) return
    // Scroll only the rail, never the article or document.
    viewport.scrollTop = Math.max(0, activeIndex * ROW_HEIGHT - viewport.clientHeight / 2 + ROW_HEIGHT / 2)
  }, [activeIndex, expanded, railWidth, locked])

  const collapse = () => {
    setExpanded(false)
    setHoveredIndex(null)
  }

  const scrollTo = (id: string) => {
    const heading = document.getElementById(id)
    if (!heading) return
    if (unlockJump.current) clearTimeout(unlockJump.current)
    jumpTarget.current = id
    setActiveId(id)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' })
    history.replaceState(history.state, '', '#' + encodeURIComponent(id))
    unlockJump.current = setTimeout(() => {
      jumpTarget.current = null
      unlockJump.current = null
      window.dispatchEvent(new Event('scroll'))
    }, reduce ? 0 : 1600)
    if (mobileRef.current?.open) {
      mobileRef.current.open = false
      mobileRef.current.querySelector('summary')?.focus({ preventScroll: true })
    }
  }

  const label = locale === 'zh' ? '文章目录' : 'Article contents'

  return (
    <div className="post-reading-layout">
      {items.length > 0 && railWidth > 0 && !locked ? (
        <aside
          ref={railRef}
          className="post-toc-rail"
          data-expanded={expanded || undefined}
          style={{ '--toc-width': railWidth + 'px', '--toc-selector-y': focusIndex * ROW_HEIGHT + 'px' } as CSSProperties}
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') setExpanded(true) }}
          onPointerLeave={() => { if (!railRef.current?.contains(document.activeElement)) collapse() }}
          onFocus={() => setExpanded(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) collapse() }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              (document.activeElement as HTMLElement)?.blur()
              collapse()
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, focusIndex + (event.key === 'ArrowDown' ? 1 : -1)))
              railRef.current?.querySelectorAll<HTMLAnchorElement>('a')[next]?.focus()
            }
          }}
        >
          <nav aria-label={label}>
            <div ref={viewportRef} className="post-toc-viewport">
              <ol>
                <li className="post-toc-selector" aria-hidden="true"><span /></li>
                {items.map((item, index) => {
                  const distance = Math.min(4, Math.abs(index - focusIndex))
                  const active = item.id === activeId
                  return (
                    <li key={item.id} className="post-toc-item" data-active={active || undefined} data-distance={distance} data-level={item.level}>
                      <a
                        href={'#' + encodeURIComponent(item.id)}
                        aria-current={active ? 'location' : undefined}
                        aria-describedby={expanded && distance === 0 ? captionId : undefined}
                        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHoveredIndex(index) }}
                        onFocus={() => setHoveredIndex(index)}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                          event.preventDefault()
                          setExpanded(true)
                          setHoveredIndex(index)
                          scrollTo(item.id)
                        }}
                      >
                        <span className="post-toc-bar" aria-hidden="true" />
                        <span className="post-toc-title">{item.text}</span>
                        <span className="post-toc-reading-dot" aria-hidden="true" />
                      </a>
                    </li>
                  )
                })}
              </ol>
            </div>
            <div className="post-toc-caption" aria-hidden={!expanded}>
              <span>{String(focusIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
              <p id={captionId}>{items[focusIndex]?.text}</p>
            </div>
          </nav>
        </aside>
      ) : null}

      <div ref={contentRef} className="post-reading-content mx-auto w-full max-w-2xl">
        {items.length > 0 && railWidth === 0 && !locked ? (
          <details ref={mobileRef} className="post-toc-mobile" onKeyDown={(event) => {
            if (event.key === 'Escape' && mobileRef.current) {
              mobileRef.current.open = false
              mobileRef.current.querySelector('summary')?.focus()
            }
          }}>
            <summary>{label}<span aria-hidden="true"> +</span></summary>
            <nav aria-label={label}>
              {items.map((item) => (
                <a key={item.id} href={'#' + encodeURIComponent(item.id)} data-level={item.level} aria-current={item.id === activeId ? 'location' : undefined}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                    event.preventDefault()
                    scrollTo(item.id)
                  }}>{item.text}</a>
              ))}
            </nav>
          </details>
        ) : null}
        {children}
      </div>
    </div>
  )
}
