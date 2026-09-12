import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, locales, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getPost, getPostSlugs } from '@/lib/posts'
import { ArrowLeftIcon } from '@/components/icons'

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getPostSlugs(locale).map((slug) => ({ locale, slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) return {}
  const post = await getPost(raw, slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary || undefined,
    alternates: localizedAlternates(raw, `/blog/${slug}`),
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale: Locale = isLocale(raw) ? raw : notFound()
  const t = getMessages(locale)
  const post = await getPost(locale, slug)
  if (!post) return notFound()

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href={`/${locale}/blog`}
        className="link inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {t.posts.back}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
        <span aria-hidden>·</span>
        <span>
          {t.posts.readingTime} {post.readingMinutes} min
        </span>
        {post.tags.length > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span>{post.tags.join(' / ')}</span>
          </>
        ) : null}
      </div>

      <div
        className="prose prose-y mt-10 max-w-none"
        // 内容来自本站 content/ 目录下自己维护的 Markdown，视为可信输入
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  )
}
