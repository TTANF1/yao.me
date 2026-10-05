'use client'

import type { Locale } from '@/lib/locale'
import type { PlaygroundProject } from '@/lib/projects-data'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { EdgewisePreview } from './edgewise-preview'
import { GameTransitionLink } from './game-transition-link'
import styles from './lab-workbench.module.css'

export function LabWorkbench({ projects, locale }: { projects: PlaygroundProject[]; locale: Locale }) {
  const root = useRef<HTMLElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [scrollActive, setScrollActive] = useState<string | null>(null)
  const [running, setRunning] = useState(true)
  const zh = locale === 'zh'
  useEffect(() => {
    const element = root.current
    if (!element) return
    let visible = true
    const update = () => setRunning(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    const mobile = window.matchMedia('(max-width: 700px)')
    let frame = 0
    const update = () => {
      frame = 0
      let active: string | null = null
      let distance = Infinity
      if (mobile.matches) {
        const viewport = window.innerHeight
        element.querySelectorAll<HTMLElement>('[data-lab-object]').forEach((object) => {
          const rect = object.getBoundingClientRect()
          if (rect.bottom <= viewport * .2 || rect.top >= viewport * .8) return
          const nextDistance = Math.abs((rect.top + rect.bottom) / 2 - viewport / 2)
          if (nextDistance < distance) {
            distance = nextDistance
            active = object.dataset.labObject ?? null
          }
        })
      }
      setScrollActive(active)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    mobile.addEventListener('change', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      mobile.removeEventListener('change', schedule)
    }
  }, [])

  return (
    <section ref={root} className={styles.workbench} data-running={running} aria-label={zh ? '实验室' : 'Experimental lab'}>
      <div className={styles.stage}>
        <div className={styles.tableFrame}>
          <Image className={styles.table} src="/games/main/project-table-bg.png" width={1846} height={852}
            sizes="(max-width: 1400px) 115vw, 1608px" alt="" draggable={false} />
        </div>
        {projects.map((item, index) => {
          const className = `${styles.object} ${item.prop === 'edgewise' ? styles.machine : styles.kitchen}`
          const contents = item.prop === 'edgewise' ? <>
            <span className={styles.screen}><EdgewisePreview className={styles.preview} /></span>
            <Image className={styles.machineImage} src="/games/main/edgewise-machine.png" width={1536} height={1024}
              sizes="(max-width: 700px) 90vw, (max-width: 1400px) 44vw, 620px" alt="" draggable={false} />
          </> : <>
            <Image className={styles.pot} src="/games/main/boo-boo-kitchen-pot.png" width={1536} height={1024}
              sizes="(max-width: 700px) 90vw, (max-width: 1400px) 38vw, 540px" alt="" draggable={false} />
            {(hovered === item.id || scrollActive === item.id) && <span className={styles.words} aria-hidden="true"><span>egg</span><span>pork</span><span>mixing!</span></span>}
            <span className={styles.lid}>
              <Image src="/games/main/boo-boo-kitchen-pot-lid.png" width={1536} height={1024}
                sizes="(max-width: 700px) 60vw, (max-width: 1400px) 26vw, 370px" alt="" draggable={false} />
            </span>
          </>
          const pointerHandlers = {
            onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
              if (event.pointerType === 'mouse') setHovered(item.id)
            },
            onPointerLeave: () => setHovered(null),
          }
          const triggerContents = <>
            {contents}
            <span className={styles.objectLabel}><span>0{index + 1}</span> {item.name}<span className={styles.marker} aria-hidden="true">+</span></span>
          </>
          return (
            <div key={item.id} className={className} data-scroll-active={scrollActive === item.id} {...pointerHandlers}>
              {item.availability === 'playable' ? (
                <GameTransitionLink className={styles.trigger} href={`/${locale}${item.href}`} prefetch={false}
                  data-lab-object={item.id}
                  aria-label={`${item.name} — ${zh ? '进入实验' : 'enter experiment'}`}
                  aria-describedby={`lab-thought-${item.id}`}>
                  {triggerContents}
                </GameTransitionLink>
              ) : (
                <button className={styles.trigger} type="button" aria-disabled="true"
                  data-lab-object={item.id}
                  aria-label={`${item.name} — ${item.status}`} aria-describedby={`lab-thought-${item.id}`}>
                  {triggerContents}
                </button>
              )}
              <span id={`lab-thought-${item.id}`} className={styles.thought} role="tooltip">
                <span className={styles.thoughtStatus}>{item.status}</span>
                <strong>{item.kicker}</strong>
                <span>{item.summary}</span>
                <span className={styles.thoughtHint}>{item.availability === 'playable'
                  ? zh ? '点击机器，开始鉴证 ↗' : 'Click the machine to inspect ↗'
                  : zh ? '炉子还在预热，敬请期待。' : 'The stove is warming up. Coming soon.'}</span>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
