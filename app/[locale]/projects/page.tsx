import type { Metadata } from 'next'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { Reveal } from '@/components/reveal'
import { ScrambleText } from '@/components/scramble-text'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  return {
    title: t.projects.title,
    description: t.projects.description,
    alternates: localizedAlternates(locale, '/projects'),
  }
}

export default async function ProjectsPage({
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
        id="page-title-projects"
        as="h1"
        className="text-3xl font-semibold tracking-tight"
        text={t.projects.title}
      />

      {/* 内容：语言切换时块级滚动过渡（A 方案，原生 View Transition） */}
      <div style={{ viewTransitionName: 'page-content' }}>

        <Reveal>
          <div className="mt-10 border-t border-line py-12 text-center">
            <p className="text-muted">{t.projects.empty}</p>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
