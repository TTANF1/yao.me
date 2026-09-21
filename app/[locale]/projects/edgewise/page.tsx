import { EdgewisePlayground } from '@/components/edgewise-playground'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import type { Metadata } from 'next'
import Link from 'next/link'

const copy = {
  zh: {
    title: 'Edgewise · 颜色归队',
    description: '把散落的边缘像素收成颜色组，看看一次判断如何让它们归位。',
    back: '返回实验场',
    heading: '散落的是像素，归队的是颜色。',
    intro: '拉开这幅像素画，把同色候选收在一起。选一组，看看 Edgewise 如何借助 JEV 的判断，修正边缘的背景色污染。',
  },
  en: {
    title: 'Edgewise · Colors, reunited',
    description: 'Gather scattered edge pixels by color, then watch one judgment send them home.',
    back: 'Back to playground',
    heading: 'Scattered pixels. Shared colors.',
    intro: 'Pull the candidate pixels into color groups. Choose one and explore how Edgewise uses a JEV judgment to guide edge decontamination.',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  return {
    title: copy[locale].title,
    description: copy[locale].description,
    alternates: localizedAlternates(locale, '/projects/edgewise'),
  }
}

export default async function EdgewiseProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = copy[locale]

  return (
    <div className="edgewise-project-page">
      <Link href={`/${locale}/projects`} className="edgewise-project-back">← {t.back}</Link>
      <header className="edgewise-project-heading">
        <p>PLAYABLE PROJECT / 01</p>
        <h1>Edgewise<span aria-hidden="true">.</span></h1>
        <h2>{t.heading}</h2>
        <p>{t.intro}</p>
      </header>
      <div style={{ viewTransitionName: 'page-content' }}>
        <EdgewisePlayground locale={locale} />
      </div>
    </div>
  )
}
