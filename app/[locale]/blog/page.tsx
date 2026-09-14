import type { Metadata } from 'next'
import Link from 'next/link'
import { isLocale, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getAllPosts } from '@/lib/posts'
import { ScrambleText } from '@/components/scramble-text'
import { Reveal } from '@/components/reveal'

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

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      {/* 页头：语言切换时文字洗牌（B 方案） */}
      <ScrambleText
        id="page-title-blog"
        as="h1"
        className="text-3xl font-semibold tracking-tight"
        text={t.blog.title}
      />

      {/* 内容：语言切换时块级滚动过渡（A 方案，原生 View Transition） */}
      <div style={{ viewTransitionName: 'page-content' }}>

        <Reveal>
          {posts.length > 0 ? (
            <ul className="mt-10 space-y-8">
              {posts.map((post) => (
                <li key={post.slug} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
                  <Link href={`/${locale}/blog/${post.slug}`} className="group block">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="list-title text-lg font-medium text-foreground/85 hover:text-foreground">{post.title}</h2>
                      <time className="shrink-0 text-sm text-muted">
                        {formatDate(post.date, locale)}
                      </time>
                    </div>
                    {post.summary ? (
                      <p className="mt-1.5 text-sm text-muted">{post.summary}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-muted">{t.blog.empty}</p>
          )}
        </Reveal>
      </div>
    </div>
  )
}
