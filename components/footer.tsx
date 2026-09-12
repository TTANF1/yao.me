import type { Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { site } from '@/lib/site'
import { GitHubIcon, MailIcon, RssIcon } from './icons'

export function Footer({ locale }: { locale: Locale }) {
  const t = getMessages(locale)
  const email = locale === 'zh' ? site.social.emailZh : site.social.emailEn
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {site.name}. {t.footer.rights}.
        </p>
        <div className="flex items-center gap-4">
          <a
            href={site.social.github.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link inline-flex items-center gap-1.5"
          >
            <GitHubIcon />
            GitHub
          </a>
          <a href={`mailto:${email}`} className="link inline-flex items-center gap-1.5">
            <MailIcon />
            Email
          </a>
          <a href="/feed.xml" className="link inline-flex items-center gap-1.5">
            <RssIcon />
            {t.footer.rss}
          </a>
        </div>
      </div>
    </footer>
  )
}
