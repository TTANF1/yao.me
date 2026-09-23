import ProjectCard from '@/components/project-card'
import { Reveal } from '@/components/reveal'
import { ScrambleText } from '@/components/scramble-text'
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
  const t = getMessages(locale)
  const projects = getProjects(locale)

  return (
    <div className="classified-page projects-page">
      <p className="classified-kicker">LABS // {locale === 'zh' ? 'OPEN EXPERIMENTS' : 'OPEN EXPERIMENTS'}</p>
      <ScrambleText
        id="page-title-projects"
        as="h1"
        className="classified-page-title"
        text={t.projects.title}
      />
      <Reveal>
        <p className="classified-page-lead">{t.projects.description}</p>
      </Reveal>

      {/* 可玩的实验项目 */}
      <div className="projects-list">
        <div style={{ viewTransitionName: 'page-content' }}>
          <div className="space-y-10">
            {projects.map((project) => (
              <Reveal key={project.id}>
                <ProjectCard project={project} locale={locale} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
