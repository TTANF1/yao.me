import { isLocale, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { HeroTypewriter } from '@/components/hero-typewriter'
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
      {/* Hero：GSAP 打字机逐行输出 + 闪烁光标（SSR 首帧输出完整文本，保证无 JS 可读与 SEO） */}
      <section className="py-16 sm:py-20">
        <HeroTypewriter
          lines={[
            {
              text: t.hero.greeting,
              as: 'p',
              className: 'text-muted',
              fadeIn: true,
            },
            {
              text: t.hero.name,
              as: 'h1',
              className: 'mt-2 text-4xl font-semibold tracking-tight sm:text-5xl',
              cps: 0.16,
            },
            {
              text: t.hero.tagline,
              as: 'p',
              className: 'mt-4 text-lg text-foreground/90',
            },
            {
              text: t.hero.intro,
              as: 'p',
              className: 'mt-3 max-w-xl text-muted',
              cps: 0.05,
            },
          ]}
        />
      </section>
      {/* 签名水印：右下角背景装饰，按笔画顺序描边画出（循环） */}
      <SignatureWatermark className="sig-watermark" />
    </div>
  )
}
