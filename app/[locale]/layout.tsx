import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '../globals.css'
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { site } from '@/lib/site'
import { Header } from '@/components/header'
import { ScrollHeader } from '@/components/scroll-header'
import { Footer } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { NavTransitionBridge } from '@/components/nav-transition-bridge'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const t = getMessages(raw)
  const languages: Record<string, string> = {
    zh: '/zh',
    en: '/en',
    'x-default': `/${defaultLocale}`,
  }
  return {
    metadataBase: new URL(site.url),
    title: { default: t.seo.title, template: `%s · ${site.name}` },
    description: t.seo.description,
    alternates: { canonical: `/${raw}`, languages },
    openGraph: {
      type: 'website',
      locale: raw === 'zh' ? 'zh_CN' : 'en_US',
      siteName: site.name,
      title: t.seo.title,
      description: t.seo.description,
      url: `${site.url}/${raw}`,
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : notFound()

  return (
    <html
      lang={locale === 'zh' ? 'zh-CN' : 'en'}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* 首帧前应用主题，避免暗色模式闪烁（FOUC）。
            用原生 script 而非 next/script：直接输出到静态 HTML <head>，解析时即执行；
            next/script 的 beforeInteractive 内联脚本会进 RSC payload 触发 React 19 的 script 渲染警告。 */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s? s==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;var el=document.documentElement;if(d)el.classList.add('dark');el.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <NavTransitionBridge />
          <Header locale={locale} />
          <ScrollHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer locale={locale} />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
