import type { Metadata } from 'next'
import Link from 'next/link'
import { isLocale, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getAllNotes } from '@/lib/posts'
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
    title: t.notes.title,
    description: t.notes.description,
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
      <div style={{ viewTransitionName: 'page-content' }}>

        <Reveal>
          {notes.length > 0 ? (
          <ul className="mt-10 space-y-8">
            {notes.map((note) => (
              <li key={note.slug} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
                <Link href={`/${locale}/notes/${note.slug}`} className="group block">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="link text-lg font-medium">{note.title}</h2>
                    <time className="shrink-0 text-sm text-muted">
                      {formatDate(note.date, locale)}
                    </time>
                  </div>
                  {note.summary ? (
                    <p className="mt-1.5 text-sm text-muted">{note.summary}</p>
                  ) : null}
                  {note.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                      {note.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-line px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
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
