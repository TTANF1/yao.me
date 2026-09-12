import { getMessages } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import { site } from '@/lib/site'
import Link from 'next/link'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeToggle } from './theme-toggle'
import { ScrambleText } from './scramble-text'

export function Header({ locale }: { locale: Locale }) {
  const t = getMessages(locale)
  const nav = [
    { key: 'home', href: `/${locale}`, label: t.nav.home },
    { key: 'blog', href: `/${locale}/blog`, label: t.nav.blog },
    { key: 'projects', href: `/${locale}/projects`, label: t.nav.projects },
    { key: 'about', href: `/${locale}/about`, label: t.nav.about },
  ]

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur"
      style={{ viewTransitionName: 'site-header' }}
    >
      <div className="mx-auto flex min-h-14 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 px-6 py-2">
        <Link href={`/${locale}`} className="shrink-0 font-semibold tracking-tight">
          {site.name}
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5" aria-label="Main">
          {nav.map((item) => (
            <Link key={item.key} href={item.href} className="link">
              {/* 语言切换时导航文字做洗牌动效（B 方案，header 固定使用） */}
              <ScrambleText id={`nav-${item.key}`} text={item.label} />
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <LocaleSwitcher current={locale} label={t.locale.switchTo} />
          <ThemeToggle label={t.theme.toggle} />
        </div>
      </div>
    </header>
  )
}
