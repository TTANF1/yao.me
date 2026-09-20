import { EdgewisePlayground } from '@/components/edgewise-playground'
import { Reveal } from '@/components/reveal'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import type { Metadata } from 'next'
import Link from 'next/link'

const copy = {
  zh: {
    title: 'Edgewise · 像素边缘鉴证所',
    description: '走进一个像素，看看 Edgewise 如何判断并修复背景色污染。',
    back: '返回实验场',
    eyebrow: 'PLAYABLE PROJECT / 01',
    heading: '走进一个像素，看看它为什么应该被修正。',
    intro:
      'Edgewise 不是通用抠图工具。它专门清理像素画从纯色背景导出时残留在主体边缘的浅色光晕。这个实验把真实 desk8 帧里的代表像素拆开，让规则证据、JEV 裁决和最终颜色变化都变得可见。',
    pipeline: [
      ['DETECT', '从透明边界找到值得复核的像素。'],
      ['COMPARE', '把边缘色与最近的主体内部色进行比较。'],
      ['REVIEW', 'JEV 只为候选颜色提供污染概率，不重做图形算法。'],
      ['PATCH', '按判断强度拉回 RGB，并收紧 Alpha。'],
    ],
    truthTitle: '这里展示的是什么',
    truth:
      '页面高亮的是某种候选颜色的代表像素。真实管线会先通过确定性规则缩小范围，再按颜色去重后交给 JEV；它不会让模型逐一扫描整张图片。',
  },
  en: {
    title: 'Edgewise · Pixel Forensics Lab',
    description: 'Step inside one pixel and see how Edgewise judges and repairs background contamination.',
    back: 'Back to playground',
    eyebrow: 'PLAYABLE PROJECT / 01',
    heading: 'Step inside one pixel and see why it should be repaired.',
    intro:
      'Edgewise is not a general cutout tool. It removes the pale halo left on pixel-art edges when sprites are exported from a flat background. This lab opens up representative pixels from the real desk8 frame so the rule evidence, JEV verdict, and final color change are visible.',
    pipeline: [
      ['DETECT', 'Find pixels worth reviewing along the transparent boundary.'],
      ['COMPARE', 'Compare each edge color with its nearest subject interior.'],
      ['REVIEW', 'JEV supplies contamination probability; it does not replace the graphics pipeline.'],
      ['PATCH', 'Pull RGB toward the interior and tighten alpha by verdict strength.'],
    ],
    truthTitle: 'What this visualization represents',
    truth:
      'The highlighted point is a representative pixel for a candidate color. The real pipeline narrows the search with deterministic rules, deduplicates colors, then asks JEV for review—it does not make the model scan every pixel in the image.',
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = copy[locale]
  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(locale, '/projects/edgewise'),
  }
}

export default async function EdgewiseProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = copy[locale]

  return (
    <div className="relative w-full overflow-hidden pb-32">
      <div className="edgewise-page-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
        <Link href={`/${locale}/projects`} className="link inline-flex items-center gap-2 text-sm">
          <span aria-hidden="true">←</span>
          {t.back}
        </Link>

        <header className="max-w-3xl pt-12 sm:pt-16">
          <p className="font-pixel text-[11px] tracking-[0.18em] text-accent">{t.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
            Edgewise
          </h1>
          <p className="mt-5 text-xl leading-snug tracking-tight text-foreground/90 sm:text-3xl">
            {t.heading}
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-muted sm:text-base">{t.intro}</p>
        </header>

        <div className="mt-12 sm:mt-16" style={{ viewTransitionName: 'page-content' }}>
          <EdgewisePlayground locale={locale} />
        </div>

        <Reveal className="mt-16 sm:mt-24">
          <div className="edgewise-pipeline">
            {t.pipeline.map(([label, description], index) => (
              <div key={label}>
                <span className="font-pixel">0{index + 1} / {label}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mx-auto mt-16 max-w-2xl sm:mt-20">
          <div className="edgewise-truth-card">
            <p className="font-pixel">PIPELINE NOTE</p>
            <h2>{t.truthTitle}</h2>
            <p>{t.truth}</p>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
