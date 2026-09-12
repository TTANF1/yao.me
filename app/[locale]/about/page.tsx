import type { Metadata } from 'next'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { site } from '@/lib/site'
import { Reveal } from '@/components/reveal'
import { ScrambleText } from '@/components/scramble-text'
import { GitHubIcon, MailIcon } from '@/components/icons'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  return {
    title: t.about.title,
    description: t.about.intro,
    alternates: localizedAlternates(locale, '/about'),
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      {/* 页头：语言切换时文字洗牌（B 方案） */}
      <ScrambleText
        id="page-title-about"
        as="h1"
        className="text-3xl font-semibold tracking-tight"
        text={t.about.title}
      />

      {/* 内容：语言切换时块级滚动过渡（A 方案，原生 View Transition） */}
      <div style={{ viewTransitionName: 'page-content' }}>
        <p className="mt-4 text-lg text-foreground/90">{t.about.intro}</p>

        <Reveal>
          <div className="mt-8 space-y-4 leading-relaxed text-muted">
            {t.about.paragraphs.map((p) => (
              <p key={p.slice(0, 12)}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <section className="mt-16 border-t border-line pt-8">
            <h2 className="text-sm font-medium text-muted">{t.about.contact}</h2>
            <p className="mt-3 text-sm text-muted">{t.about.contactHint}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <a
                href={`mailto:${site.social.emailZh}`}
                className="link inline-flex items-center gap-1.5"
              >
                <MailIcon />
                {t.about.emailZhLabel}：{site.social.emailZh}
              </a>
              <a
                href={`mailto:${site.social.emailEn}`}
                className="link inline-flex items-center gap-1.5"
              >
                <MailIcon />
                {t.about.emailEnLabel}：{site.social.emailEn}
              </a>
              <a
                href={site.social.github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex items-center gap-1.5"
              >
                <GitHubIcon />
                GitHub
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
