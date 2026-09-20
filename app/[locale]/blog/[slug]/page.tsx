import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, locales, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getPost, getPostSlugs } from '@/lib/posts'
import { ArrowLeftIcon } from '@/components/icons'
import { ScrambleText } from '@/components/scramble-text'
import { Reveal } from '@/components/reveal'
import { BackLink } from '@/components/back-link'
import MermaidRenderer from '@/components/mermaid-renderer'
import PostToc from '@/components/post-toc'
import { ScrollToTop } from '@/components/scroll-to-top'

export const dynamicParams = false

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
    <article className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <PostToc locale={locale}>
        <div className="mx-auto max-w-2xl">
      {/* 标题：语言切换时文字洗牌（B 方案；两语言标题一致时自动跳过） */}
      <ScrambleText
        id={`post-title-${slug}`}
        as="h1"
        className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{ viewTransitionName: 'detail-title', width: 'fit-content' }}
        text={post.title}
      />

      {/* 正文：语言切换时块级滚动过渡（A 方案，原生 View Transition） */}
      <div style={{ viewTransitionName: 'page-content' }} data-vt-content>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min</span>
          {post.ai ? (
            <>
              <span aria-hidden>·</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-xs">{locale === 'zh' ? 'AI 辅助' : 'AI-assisted'}</span>
            </>
          ) : null}
        </div>

        <Reveal>
          <MermaidRenderer html={post.contentHtml} />
        </Reveal>
      </div>
          <BackLink
            href={`/${locale}/blog`}
            className="link mt-14 inline-flex items-center gap-1 border-t border-line pt-8 text-sm"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {t.posts.back}
          </BackLink>
        </div>
      </PostToc>

      {/* 回顶按钮：放 PostToc 容器外，hover 它不再触发左侧目录显示 */}
      <ScrollToTop />
    </article>
  )
}
