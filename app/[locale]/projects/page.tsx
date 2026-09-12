import type { Metadata } from 'next'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
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
    title: t.projects.title,
    description: t.projects.description,
    alternates: localizedAlternates(locale, '/projects'),
  }
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight">{t.projects.title}</h1>
      <p className="mt-2 text-muted">{t.projects.description}</p>

      <Reveal>
        <div className="mt-10 border-t border-line py-12 text-center">
          <p className="text-muted">{t.projects.empty}</p>
        </div>
      </Reveal>
    </div>
  )
}
