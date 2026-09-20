import { getMessages } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import { site } from '@/lib/site'
import Image from 'next/image'
import { GameTransitionLink } from './game-transition-link'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeToggle } from './theme-toggle'

export function Header({ locale }: { locale: Locale }) {
  const t = getMessages(locale)
  const nav = [
    { key: 'blog', href: `/${locale}/blog`, label: t.nav.blog },
    { key: 'notes', href: `/${locale}/notes`, label: t.nav.notes },
    { key: 'projects', href: `/${locale}/projects`, label: t.nav.projects },
    { key: 'about', href: `/${locale}/about`, label: t.nav.about },
  ]

  return (
    <header
      data-site-header
      className="game-header sticky top-0 z-40 transition-transform duration-300"
      style={{ viewTransitionName: 'site-header' }}
    >
      <div className="game-header-inner">
        <GameTransitionLink href={`/${locale}`} className="game-brand" aria-label={site.name}>
          <span className="relative block h-9 w-9 overflow-hidden rounded-full">
            <Image
              src="/favicon-logo.png"
              alt={site.name}
              width={36}
              height={36}
              sizes="48px"
              className="h-full w-full object-cover"
            />
          </span>
          <span>YAO<span className="text-accent">//</span>ME</span>
        </GameTransitionLink>
        <nav className="game-hud-nav" aria-label="Main">
          {nav.map((item, index) => (
            <GameTransitionLink key={item.key} href={item.href}>
              <i className="font-pixel">0{index + 1}</i>
              {item.label}
            </GameTransitionLink>
          ))}
        </nav>
        <div className="game-header-tools">
          <LocaleSwitcher current={locale} label={t.locale.switchTo} />
          <ThemeToggle label={t.theme.toggle} />
        </div>
      </div>
    </header>
  )
}