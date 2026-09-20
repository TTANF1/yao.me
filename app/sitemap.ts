import type { MetadataRoute } from 'next'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getNoteSlugs, getPostSlugs } from '@/lib/posts'
import { site } from '@/lib/site'

const STATIC_PATHS = ['', '/blog', '/notes', '/projects', '/projects/edgewise', '/about'] as const

function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {
    'x-default': `/${defaultLocale}${path}`,
  }
  for (const l of locales) {
    languages[l] = `/${l}${path}`
  }
  return languages
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales as readonly Locale[]) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: `${site.url}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p === '' ? 'weekly' : 'monthly',
        priority: p === '' ? 1 : 0.8,
        alternates: { languages: languageAlternates(p) },
      })
    }
    for (const slug of getNoteSlugs(locale)) {
      const path = `/notes/${slug}`
      entries.push({
        url: `${site.url}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.6,
        alternates: { languages: languageAlternates(path) },
      })
    }
    for (const slug of getPostSlugs(locale)) {
      const path = `/blog/${slug}`
      entries.push({
        url: `${site.url}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.6,
        alternates: { languages: languageAlternates(path) },
      })
    }
  }

  return entries
}
