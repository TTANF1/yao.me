import { site } from './site'

export const locales = site.locales
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = site.defaultLocale

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/** 从 Accept-Language 头解析一个最接近的站点语言 */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale
  const first = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? ''
  if (first.startsWith('zh')) return 'zh'
  if (first.startsWith('en')) return 'en'
  return defaultLocale
}

/** 为 metadata 生成各语言的 canonical / hreflang 交替链接 */
export function localizedAlternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {
    zh: `/zh${path}`,
    en: `/en${path}`,
    'x-default': `/${defaultLocale}${path}`,
  }
  return { canonical: `/${locale}${path}`, languages }
}

/** 按语言格式化日期（避免时区偏移：按本地时间解析） */
export function formatDate(date: string, locale: Locale): string {
  if (!date) return ''
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
