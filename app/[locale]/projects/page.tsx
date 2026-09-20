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
    <div className="relative w-full">
      {/* 页头 */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-16 sm:pt-24">
        <ScrambleText
          id="page-title-projects"
          as="h1"
          className="text-3xl font-semibold tracking-tight"
          text={t.projects.title}
        />
        <Reveal>
          <p className="mt-4 text-muted">{t.projects.description}</p>
        </Reveal>
      </div>

      {/* 可玩的实验项目 */}
      <div className="mx-auto w-full max-w-4xl px-6 pb-32 pt-10">
        <div style={{ viewTransitionName: 'page-content' }} className="relative z-10">
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
