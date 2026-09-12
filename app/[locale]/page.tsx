import Link from 'next/link'
import { isLocale, formatDate, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getAllPosts } from '@/lib/posts'
import { site } from '@/lib/site'
import { Reveal } from '@/components/reveal'
import { ArrowRightIcon, GitHubIcon, MailIcon } from '@/components/icons'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  const posts = getAllPosts(locale).slice(0, 3)
  const email = locale === 'zh' ? site.social.emailZh : site.social.emailEn

  return (
    <div className="mx-auto w-full max-w-2xl px-6">
      {/* Hero：无动画，首帧可读 */}
      <section className="py-24 sm:py-32">
        <p className="text-muted">{t.hero.greeting}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          {t.hero.name}
        </h1>
        <p className="mt-4 text-lg text-foreground/90">{t.hero.tagline}</p>
        <p className="mt-3 max-w-xl text-muted">{t.hero.intro}</p>
      </section>

      {/* 我在做什么 */}
      <Reveal>
        <section className="border-t border-line py-16">
          <h2 className="text-sm font-medium text-muted">{t.what.title}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {t.what.items.map((item) => (
              <div key={item.title}>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 最新文章 */}
      <Reveal>
        <section className="border-t border-line py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium text-muted">{t.posts.title}</h2>
            <Link
              href={`/${locale}/blog`}
              className="link inline-flex items-center gap-1 text-sm"
            >
              {t.posts.viewAll}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {posts.length > 0 ? (
            <ul className="mt-6 space-y-5">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/${locale}/blog/${post.slug}`} className="group block">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="link font-medium">{post.title}</span>
                      <time className="shrink-0 text-sm text-muted">
                        {formatDate(post.date, locale)}
                      </time>
                    </div>
                    {post.summary ? (
                      <p className="mt-1 text-sm text-muted">{post.summary}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-muted">{t.posts.empty}</p>
          )}
        </section>
      </Reveal>

      {/* 精选作品（v1 占位） */}
      <Reveal>
        <section className="border-t border-line py-16">
          <h2 className="text-sm font-medium text-muted">{t.works.title}</h2>
          <p className="mt-6 text-muted">{t.works.empty}</p>
        </section>
      </Reveal>

      {/* 社交 */}
      <Reveal>
        <section className="border-t border-line py-16">
          <h2 className="text-sm font-medium text-muted">{t.socials.title}</h2>
          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <a
              href={site.social.github.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link inline-flex items-center gap-1.5"
            >
              <GitHubIcon />
              GitHub
            </a>
            <a href={`mailto:${email}`} className="link inline-flex items-center gap-1.5">
              <MailIcon />
              Email
            </a>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
