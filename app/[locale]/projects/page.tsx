import { LabWorkbench } from '@/components/lab-workbench'
import { ScrambleText } from '@/components/scramble-text'
import styles from '@/components/lab-workbench.module.css'
import { getMessages } from '@/lib/i18n'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getProjects } from '@/lib/projects-data'
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
  const projects = getProjects(locale)
  const t = getMessages(locale)

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className="classified-kicker">LABS // OPEN EXPERIMENTS</p>
        <ScrambleText id="page-title-projects" as="h1" className={styles.title} text={t.projects.title} />
        <p className={styles.lead}>{t.projects.description}</p>
      </header>
      <div style={{ viewTransitionName: 'page-content' }}>
        <LabWorkbench projects={projects} locale={locale} />
      </div>
    </div>
  )
}
