'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { Locale } from '@/lib/locale'
import { GameTransitionLink } from './game-transition-link'
import { SignatureWatermark } from './signature-watermark'
import { ScrambleText } from './scramble-text'
import styles from './game-home.module.css'

gsap.registerPlugin(useGSAP)

// Client navigation / locale changes keep the settled composition in this document.
let entrancePlayed = false

interface GameHomeProps {
  locale: Locale
  hero: { greeting: string; name: string; tagline: string; intro: string }
  nav: { blog: string; notes: string; projects: string; about: string }
}

export function GameHome({ locale, hero, nav }: GameHomeProps) {
  const root = useRef<HTMLDivElement>(null)
  const portrait = useRef<HTMLImageElement>(null)

  useGSAP(() => {
    const scene = root.current
    if (!scene) return
    if (entrancePlayed) {
      scene.dataset.homeReady = 'true'
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      entrancePlayed = true
      scene.dataset.homeReady = 'true'
      return
    }

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.out' },
      onComplete: () => { entrancePlayed = true },
    })
    timeline
      .from('[data-home-backdrop]', { opacity: 0, scale: 1.06, duration: 1.1 }, 0)
      .from('[data-home-portrait]', { opacity: 0, y: 64, scale: 1.07, rotation: -3, duration: 1.25 }, 0.08)
      .from('[data-home-copy] > *', { opacity: 0, x: -38, y: 12, duration: 0.72, stagger: 0.09 }, 0.2)
      .from('[data-home-menu-item]', { opacity: 0, x: 70, duration: 0.8, stagger: 0.11 }, 0.4)
      .from('[data-home-caption]', { opacity: 0, y: 12, duration: 0.7 }, 0.8)
    scene.dataset.homeReady = 'true'

    // Decode before revealing the character; a failed/slow image never blocks the UI.
    let cancelled = false
    const play = () => { if (!cancelled && timeline.paused()) timeline.play() }
    const fallback = window.setTimeout(play, 1400)
    const image = portrait.current
    if (image) void image.decode().then(play, play)
    else play()
    const finishOnFocus = () => { timeline.progress(1).pause() }
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finishOnReduce = () => { if (motionPreference.matches) finishOnFocus() }
    scene.addEventListener('focusin', finishOnFocus)
    motionPreference.addEventListener('change', finishOnReduce)

    return () => {
      cancelled = true
      window.clearTimeout(fallback)
      scene.removeEventListener('focusin', finishOnFocus)
      motionPreference.removeEventListener('change', finishOnReduce)
    }
  }, { scope: root })

  useEffect(() => {
    const scene = root.current
    if (!scene) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    let lastTime = 0
    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    let visible = true

    const paint = () => {
      scene.style.setProperty('--camera-x', x.toFixed(4))
      scene.style.setProperty('--camera-y', y.toFixed(4))
    }
    const tick = (time: number) => {
      const delta = lastTime ? Math.min(time - lastTime, 50) : 16.67
      lastTime = time
      const damping = 1 - Math.exp(-delta / 110)
      x += (targetX - x) * damping
      y += (targetY - y) * damping
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.001
      if (settled) { x = targetX; y = targetY }
      paint()
      frame = settled ? 0 : window.requestAnimationFrame(tick)
    }
    const schedule = () => {
      if (!frame) { lastTime = 0; frame = window.requestAnimationFrame(tick) }
    }
    const move = (event: PointerEvent) => {
      if (!visible || document.hidden || !media.matches || event.pointerType !== 'mouse') return
      targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1))
      targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1))
      schedule()
    }
    const reset = () => { targetX = 0; targetY = 0; schedule() }
    const stop = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
      x = y = targetX = targetY = 0
      paint()
    }
    const visibility = () => { if (document.hidden) stop() }
    const preference = () => { if (!media.matches) stop() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible) stop()
    })
    observer.observe(scene)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', visibility)
    media.addEventListener('change', preference)
    return () => {
      stop()
      observer.disconnect()
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', visibility)
      media.removeEventListener('change', preference)
    }
  }, [])

  const items = [
    { id: '01', key: 'blog', label: nav.blog, sub: 'STORY ARCHIVE' },
    { id: '02', key: 'notes', label: nav.notes, sub: 'MISSION REPORTS' },
    { id: '03', key: 'projects', label: nav.projects, sub: 'PLAYABLE LABS' },
    { id: '04', key: 'about', label: nav.about, sub: 'PLAYER PROFILE' },
  ]

  return (
    <div ref={root} className={styles.home} data-home-scene data-locale={locale} style={{ viewTransitionName: 'page-home' }}>
      <div className={styles.camera}>
        <div className={styles.backdropDepth} aria-hidden="true">
          <div className={styles.backdrop} data-home-backdrop>
            <div className={styles.paperShards} />
            <div className={styles.redShards} />
            <div className={styles.menuField} />
            <div className={styles.halftone} />
            <div className={styles.speedLines} />
            <span className={styles.backgroundType}>CREATE<br />SOMETHING.</span>
          </div>
        </div>

        <div className={styles.portraitDepth} aria-hidden="true">
          <div className={styles.portraitArt}>
            <div className={styles.portraitEntrance} data-home-portrait>
              <Image ref={portrait} src="/images/home/yao-street-portrait.png" alt="" fill sizes="(max-width: 800px) 900px, 140vh" loading="eager" fetchPriority="high" draggable={false} />
            </div>
          </div>
        </div>

        <section className={styles.copyDepth} aria-label={locale === 'zh' ? '自我介绍' : 'Introduction'}>
          <div className={styles.copy} data-home-copy>
            <p className={styles.player}>PLAYER // 01</p>
            <p className={styles.greeting}><ScrambleText id="hero-greeting" text={hero.greeting} /></p>
            <h1><ScrambleText id="hero-name" text={hero.name} /><span className={styles.nameDot}>.</span></h1>
            <strong className={styles.tagline}><ScrambleText id="hero-tagline" text={hero.tagline} /></strong>
            <p className={styles.intro}><ScrambleText id="hero-intro" text={hero.intro} /></p>
            <span className={styles.copySlash} aria-hidden="true" />
          </div>
        </section>

        <nav className={styles.menuDepth} aria-label={locale === 'zh' ? '探索网站' : 'Explore the site'}>
          <div className={styles.menu}>
            {items.map((item) => (
              <div key={item.id} className={styles.menuRow}>
                <div data-home-menu-item>
                  <GameTransitionLink href={`/${locale}/${item.key}`} className={styles.menuItem}>
                    <i>{item.id}</i>
                    <span className={styles.menuLabel}><ScrambleText id={`home-menu-${item.key}`} text={item.label} /></span>
                    <small>{item.sub}</small>
                    <b aria-hidden="true" />
                  </GameTransitionLink>
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className={styles.caption} data-home-caption aria-hidden="true">
          <span>/</span><p>FRONTEND<br />ENGINEER /<br />CONTENT CREATOR</p>
        </div>
      </div>
      <SignatureWatermark className={styles.signature} />
    </div>
  )
}
