import type { Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { site } from '@/lib/site'
import { GitHubIcon, MailIcon, RssIcon } from './icons'

export function Footer({ locale, variant = 'default' }: { locale: Locale; variant?: 'default' | 'home' }) {
  const t = getMessages(locale)
  const email = locale === 'zh' ? site.social.emailZh : site.social.emailEn
  const year = new Date().getFullYear()
  const copyright = <>© {year} {site.name}. {t.footer.rights}.</>
  const links = (
    <>
      <a href={site.social.github.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5" aria-label="GitHub" title="GitHub">
        <GitHubIcon /><span>GitHub</span>
      </a>
      <a href={`mailto:${email}`} className="link inline-flex items-center gap-1.5" aria-label="Email" title="Email">
        <MailIcon /><span>Email</span>
      </a>
      <a href="/feed.xml" className="link inline-flex items-center gap-1.5" aria-label={t.footer.rss} title={t.footer.rss}>
        <RssIcon /><span>{t.footer.rss}</span>
      </a>
    </>
  )

  if (variant === 'home') {
    return (
      <footer data-home-footer>
        <p data-home-copyright>{copyright}</p>
        <nav data-home-social aria-label={locale === 'zh' ? '社交与订阅' : 'Social and subscriptions'}>{links}</nav>
      </footer>
    )
  }

  return (
    <footer className="game-footer border-t border-line">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{copyright}</p>
        <div className="flex items-center gap-4">{links}</div>
      </div>
    </footer>
  )
}
