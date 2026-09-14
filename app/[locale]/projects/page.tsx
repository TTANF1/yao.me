import PhoneFrame from '@/components/phone-frame'
import ProjectCard from '@/components/project-card'
import { Reveal } from '@/components/reveal'
import { ScrambleText } from '@/components/scramble-text'
import { getMessages } from '@/lib/i18n'
import { isLocale, localizedAlternates, type Locale } from '@/lib/locale'
import { getCompanies } from '@/lib/projects-data'
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
  const companies = getCompanies(locale)

  return (
    <div className="relative w-full">
      {/* 页头 */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-16 sm:pt-24">
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

      {/* 公司卡片流：PhoneFrame 独立渲染在卡片外，有 demo 的公司与卡片同排 */}
      <div className="mx-auto w-full max-w-2xl px-6 pb-32 pt-10">
        <div style={{ viewTransitionName: 'page-content' }} className="relative z-10">
          <div className="space-y-24">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center"
              >
                <ProjectCard company={company} />
                {company.demo ? (
                  <>
                    <PhoneFrame videos={company.demo.videos} />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
