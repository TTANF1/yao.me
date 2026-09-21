import { MissionBoard } from '@/components/mission-board'
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
  const boardCopy = locale === 'zh'
    ? { code: 'MISSION LOG // 02', lead: '一闪而过的想法，不记录下来就会消失；想做的事情不立刻去做，就会被拖到放弃。' }
    : { code: 'MISSION LOG // 02', lead: 'A fleeting thought will vanish if you don’t write it down; if you don’t do what you want to do right away, you’ll end up putting it off until you give up.' }

  return (
    <div className="game-page game-notes-page">
      <div className="game-page-shard" aria-hidden="true" />
      <header className="game-page-heading">
        <p className="font-pixel">{boardCopy.code}</p>
        <h1>{t.notes.title}</h1>
        <span>{boardCopy.lead}</span>
      </header>

      <div style={{ viewTransitionName: 'page-content' }} data-vt-content>
        {notes.length > 0 ? (
          <MissionBoard
            locale={locale}
            notes={notes.map((note) => ({
              slug: note.slug,
              title: note.title,
              summary: note.summary ?? '',
              date: formatDate(note.date, locale),
              readingMinutes: note.readingMinutes,
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
