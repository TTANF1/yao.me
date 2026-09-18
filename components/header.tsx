import { getMessages } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import { site } from '@/lib/site'
import Image from 'next/image'
import Link from 'next/link'
import { LocaleSwitcher } from './locale-switcher'
import { NavBar } from './nav-bar'
import { ThemeToggle } from './theme-toggle'

export function Header({ locale }: { locale: Locale }) {
  const t = getMessages(locale)
  const nav = [
    { key: 'home', href: `/${locale}`, label: t.nav.home },
    { key: 'blog', href: `/${locale}/blog`, label: t.nav.blog },
    { key: 'notes', href: `/${locale}/notes`, label: t.nav.notes },
    { key: 'projects', href: `/${locale}/projects`, label: t.nav.projects },
    { key: 'about', href: `/${locale}/about`, label: t.nav.about },
  ]

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 bg-background/80 backdrop-blur transition-transform duration-300"
      style={{ viewTransitionName: 'site-header' }}
    >
      <div className="mx-auto flex min-h-14 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 px-6 py-2">
        <Link href={`/${locale}`} className="shrink-0" aria-label={site.name}>
          <span className="relative block h-8 w-8 overflow-hidden rounded-full">
            <Image
              src="/favicon-logo.png"
              alt={site.name}
              width={32}
              height={32}
              quality={100}
              sizes="48px"
              className="h-full w-full object-cover"
            />
          </span>
        </Link>
        <NavBar items={nav} />
        <div className="flex shrink-0 items-center gap-1">
          <LocaleSwitcher current={locale} label={t.locale.switchTo} />
          <ThemeToggle label={t.theme.toggle} />
        </div>
      </div>
    </header>
  )
}
