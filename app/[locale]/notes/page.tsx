import { MissionBoard } from '@/components/mission-board'
import { ScrambleText } from '@/components/scramble-text'
import { getMessages } from '@/lib/i18n'
import { formatDate, isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getAllNotes, getNote } from '@/lib/posts'
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
  const noteMeta = getAllNotes(locale)
  const notes = (await Promise.all(noteMeta.map((note) => getNote(locale, note.slug))))
    .filter((note) => note !== null)
  const lead = locale === 'zh'
    ? '一闪而过的想法，不记录下来就会消失；想做的事情不立刻去做，就会被拖到放弃。'
    : 'A fleeting thought will vanish if you don’t write it down; if you don’t do what you want to do right away, you’ll end up putting it off until you give up.'

  return (
    <div className="classified-page notes-page">
      <p className="classified-kicker">NOTES // {locale === 'zh' ? 'LITTLE THOUGHTS' : 'FIELD NOTES'}</p>
      <ScrambleText
        id="page-title-notes"
        as="h1"
        className="classified-page-title"
        text={t.notes.title}
      />
      <p className="classified-page-lead">{lead}</p>

      <div style={{ viewTransitionName: 'page-content' }} data-vt-content>
        {notes.length > 0 ? (
          <MissionBoard
            locale={locale}
            notes={notes.map((note) => ({
              slug: note.slug,
              title: note.title,
              date: formatDate(note.date, locale),
              dateIso: note.date,
              contentHtml: note.contentHtml,
              ai: Boolean(note.ai),
            }))}
          />
        ) : (
          <p className="mt-10 text-muted">{t.notes.empty}</p>
        )}
      </div>
    </div>
  )
}
