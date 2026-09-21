import { ClassifiedArchive } from '@/components/classified-archive'
import { ScrambleText } from '@/components/scramble-text'
import { getMessages } from '@/lib/i18n'
import { formatDate, isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getAllPosts } from '@/lib/posts'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  return {
    title: t.blog.title,
    description: t.seo.description,
    alternates: localizedAlternates(locale, '/blog'),
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  const posts = getAllPosts(locale)
  const groups = Object.entries(
    posts.reduce<Record<string, typeof posts>>((result, post) => {
      const year = post.date.slice(0, 4)
      result[year] ??= []
      result[year].push(post)
      return result
    }, {}),
  ).sort(([a], [b]) => Number(b) - Number(a)).map(([year, entries]) => ({
    year,
    entries: entries.map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary ?? '',
      date: formatDate(post.date, locale),
    })),
  }))

  return (
    <div className="classified-page">

      <p className="classified-kicker">ARCHIVE // EYES ONLY</p>
      <ScrambleText
        id="page-title-blog"
        as="h1"
        className="classified-page-title"
        text={t.blog.title}
      />
      <p className="classified-page-lead">
        {locale === 'zh' ? '⚠️⚠️⚠️绝密情报，如若泄露，将面临严重后果⚠️⚠️⚠️' : 'Top-secret information; any disclosure will result in serious consequences.'}
      </p>

      <div style={{ viewTransitionName: 'page-content' }} data-vt-content>
        {posts.length > 0 ? <ClassifiedArchive groups={groups} locale={locale} /> : <p className="mt-10 text-muted">{t.blog.empty}</p>}
      </div>
    </div>
  )
}
