import type { Locale } from '@/lib/locale'
import { GameTransitionLink } from './game-transition-link'
import { SignatureWatermark } from './signature-watermark'
import { ScrambleText } from './scramble-text'

interface GameHomeProps {
  locale: Locale
  hero: {
    greeting: string
    name: string
    tagline: string
    intro: string
  }
  nav: {
    blog: string
    notes: string
    projects: string
    about: string
  }
}

export function GameHome({ locale, hero, nav }: GameHomeProps) {
  const items = [
    { id: '01', label: nav.blog, sub: 'STORY ARCHIVE', href: `/${locale}/blog` },
    { id: '02', label: nav.notes, sub: 'MISSION REPORTS', href: `/${locale}/notes` },
    { id: '03', label: nav.projects, sub: 'PLAYABLE LABS', href: `/${locale}/projects` },
    { id: '04', label: nav.about, sub: 'PLAYER PROFILE', href: `/${locale}/about` },
  ]

  return (
    <div className="game-home" style={{ viewTransitionName: 'page-home' }}>
      <div className="game-home-halftone" aria-hidden="true" />
      <div className="game-home-slash" aria-hidden="true" />
      <section className="game-home-hero">
        <div className="game-home-copy">
          <p className="font-pixel">PLAYER // 01</p>
          <p><ScrambleText id="hero-greeting" as="span" text={hero.greeting} /></p>
          <h1><ScrambleText id="hero-name" as="span" text={hero.name} /></h1>
          <strong><ScrambleText id="hero-tagline" as="span" text={hero.tagline} /></strong>
          <span><ScrambleText id="hero-intro" as="span" text={hero.intro} /></span>
        </div>
        <div className="game-home-visual" aria-label="Yao working at a desk in pixel art">
          <div className="game-home-burst" aria-hidden="true" />
          <div className="sprite-anim game-home-sprite" aria-hidden="true" />
          <span className="game-home-level font-pixel">LV. 06 FRONTEND</span>
        </div>
      </section>

      <nav className="game-home-menu" aria-label="Game menu">
        <p className="game-home-menu-title font-pixel">SELECT YOUR NEXT MOVE</p>
        {items.map((item, index) => (
          <GameTransitionLink key={item.id} href={item.href} className="game-menu-item" style={{ '--menu-index': index } as React.CSSProperties}>
            <i className="font-pixel">{item.id}</i>
            <span>{item.label}</span>
            <small className="font-pixel">{item.sub}</small>
            <b aria-hidden="true">›</b>
          </GameTransitionLink>
        ))}
      </nav>
      <SignatureWatermark className="game-home-signature" />
    </div>
  )
}
