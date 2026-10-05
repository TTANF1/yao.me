import { EdgewisePreview } from '@/components/edgewise-preview'
import type { PlaygroundProject } from '@/lib/projects-data'
import type { Locale } from '@/lib/locale'
import cohorts from '@/lib/edgewise-colors.json'
import Link from 'next/link'

export default function ProjectCard({ project, locale }: { project: PlaygroundProject; locale: Locale }) {
  if (project.availability !== 'playable') return null
  return (
    <Link href={`/${locale}${project.href}`} className="project-portal project-color-portal" aria-label={`${project.name}: ${project.kicker}`}>
      <article>
        <div>
          <EdgewisePreview />
          <span className="project-color-preview-label">{cohorts.sampledPixelCount} PIXELS → {cohorts.groups.length} COLORS</span>
        </div>
        <div className="project-color-copy">
          <p className="project-color-number">01 / INTERACTIVE EXPERIMENT</p>
          <h2>{project.name}<span aria-hidden="true">↗</span></h2>
          <p>{project.kicker}</p>
          <p>{project.summary}</p>
          <span className="project-color-enter">{locale === 'zh' ? '拉开，让颜色归队' : 'Pull the colors together'} →</span>
        </div>
      </article>
    </Link>
  )
}
