import { isLocale, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { ScrambleText } from '@/components/scramble-text'
import { Reveal } from '@/components/reveal'
import { SignatureWatermark } from '@/components/signature-watermark'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)

  return (
    // 首页不做块级滚动（B 方案承担视觉），page-home 只锚定不参与滚动，掩蔽 RSC 换帧闪烁
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6"
      style={{ viewTransitionName: 'page-home' }}
    >
      {/* Hero：无动画，首帧可读；语言切换时文字做洗牌动效（B 方案） */}
      <section className="py-16 sm:py-20">
        <Reveal>
          <ScrambleText
            id="hero-greeting"
            as="p"
            className="text-muted"
            text={t.hero.greeting}
          />
          <ScrambleText
            id="hero-name"
            as="h1"
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
            text={t.hero.name}
          />
          <ScrambleText
            id="hero-tagline"
            as="p"
            className="mt-4 text-lg text-foreground/90"
            text={t.hero.tagline}
          />
          <ScrambleText
            id="hero-intro"
            as="p"
            className="mt-3 max-w-xl text-muted"
            text={t.hero.intro}
          />
        </Reveal>
      </section>
      {/* 签名水印：右下角背景装饰，按笔画顺序描边画出（循环） */}
      <SignatureWatermark className="sig-watermark" />
    </div>
  )
}
