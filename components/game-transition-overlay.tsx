'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { GAME_NAVIGATE_EVENT } from './game-transition-link'

gsap.registerPlugin(useGSAP)

interface GameNavigateDetail {
  href: string
}

export function GameTransitionOverlay() {
  const root = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [destination, setDestination] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    const navigate = (event: Event) => {
      const { href } = (event as CustomEvent<GameNavigateDetail>).detail
      if (!href || busy.current) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href)
        return
      }

      busy.current = true
      setDestination(href)
      setActive(true)
    }

    window.addEventListener(GAME_NAVIGATE_EVENT, navigate)
    return () => window.removeEventListener(GAME_NAVIGATE_EVENT, navigate)
  }, [router])

  useGSAP(
    (_, contextSafe) => {
      if (!active || !destination || !contextSafe) return

      const finish = contextSafe(() => {
        busy.current = false
        setActive(false)
        setDestination(null)
      })

      const timeline = gsap.timeline({ onComplete: finish })
      timeline
        .set(root.current, { autoAlpha: 1, pointerEvents: 'auto' })
        .set('[data-game-walker]', { x: '-35vw', rotation: -4 })
        .fromTo(
          '[data-game-slice="black"]',
          { xPercent: -112 },
          { xPercent: 0, duration: 0.32, ease: 'power4.in' },
        )
        .fromTo(
          '[data-game-slice="red"]',
          { xPercent: 112 },
          { xPercent: 0, duration: 0.28, ease: 'power4.out' },
          '-=0.12',
        )
        .to(
          '[data-game-walker]',
          { x: '48vw', rotation: 1, duration: 0.72, ease: 'power1.inOut' },
          '-=0.26',
        )
        .call(() => router.push(destination), undefined, '-=0.30')
        .to('[data-game-route-label]', { autoAlpha: 1, y: 0, duration: 0.18 }, '<')
        .to('[data-game-walker]', { x: '125vw', duration: 0.58, ease: 'power2.in' }, '+=0.12')
        .to(
          '[data-game-slice]',
          { xPercent: 115, duration: 0.34, stagger: 0.04, ease: 'power4.in' },
          '-=0.15',
        )
        .set(root.current, { autoAlpha: 0, pointerEvents: 'none' })
    },
    { scope: root, dependencies: [active, destination], revertOnUpdate: true },
  )

  return (
    <div ref={root} className="game-transition" aria-hidden="true">
      <div className="game-transition-slice game-transition-black" data-game-slice="black" />
      <div className="game-transition-slice game-transition-red" data-game-slice="red" />
      <div className="game-transition-speedlines" />
      <div className="game-transition-walker" data-game-walker>
        <div className="game-whistle-sprite" />
      </div>
      <p className="game-transition-label font-pixel" data-game-route-label>
        NOW LOADING //
      </p>
    </div>
  )
}

