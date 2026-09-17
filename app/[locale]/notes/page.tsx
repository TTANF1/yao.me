import type { Metadata } from 'next'
import { isLocale, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getAllNotes } from '@/lib/posts'
import { ScrambleText } from '@/components/scramble-text'
import { Reveal } from '@/components/reveal'
import { PostListLink } from '@/components/post-list-link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  return {
    title: t.notes.title,
    description: t.seo.description,
    alternates: localizedAlternates(locale, '/notes'),
  }
}

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)
  const notes = getAllNotes(locale)

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      {/* 页头：语言切换时文字洗牌（B 方案） */}
      <ScrambleText
        id="page-title-notes"
        as="h1"
        className="text-3xl font-semibold tracking-tight"
        text={t.notes.title}
      />

      {/* 内容：语言切换时块级滚动过渡（A 方案，原生 View Transition） */}
      <div style={{ viewTransitionName: 'page-content' }} data-vt-content>

        <Reveal>
          {notes.length > 0 ? (
          <ul className="mt-10 space-y-8">
            {notes.map((note) => (
              <li key={note.slug} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
                <PostListLink href={`/${locale}/notes/${note.slug}`} kind="note" slug={note.slug} className="group block">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="list-title text-lg font-medium text-foreground/85 hover:text-foreground">{note.title}</h2>
                    <time className="shrink-0 text-sm text-muted">
                      {formatDate(note.date, locale)}
                    </time>
                  </div>
                  {note.summary ? (
                    <p className="mt-1.5 text-sm text-muted">{note.summary}</p>
                  ) : null}
                </PostListLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-muted">{t.notes.empty}</p>
          )}
        </Reveal>
      </div>
    </div>
  )
}
