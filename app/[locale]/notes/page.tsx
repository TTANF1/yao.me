import type { Metadata } from 'next'
import { isLocale, formatDate, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { getAllNotes } from '@/lib/posts'
import { MissionBoard } from '@/components/mission-board'

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
  const boardCopy = locale === 'zh'
    ? { code: 'MISSION LOG // 02', lead: '完成过的任务、踩过的坑，以及从现场带回来的记录。点击报告可展开预览。' }
    : { code: 'MISSION LOG // 02', lead: 'Completed missions, field notes, and lessons carried home. Select a report to inspect it.' }

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