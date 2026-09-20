import type { PlaygroundProject } from '@/lib/projects-data'
import type { Locale } from '@/lib/locale'
import Image from 'next/image'
import Link from 'next/link'

export default function ProjectCard({
  project,
  locale,
}: {
  project: PlaygroundProject
  locale: Locale
}) {
  return (
    <Link
      href={`/${locale}${project.href}`}
      className="project-portal group block"
      aria-label={`${project.name}: ${project.kicker}`}
    >
      <article className="project-portal-shell">
        <div className="project-portal-screen" aria-hidden="true">
          <Image
            src={project.beforeImage}
            alt=""
            width={343}
            height={245}
            className="project-portal-image"
            sizes="(max-width: 768px) 100vw, 720px"
          />
          <div className="project-portal-after">
            <Image
              src={project.afterImage}
              alt=""
              width={343}
              height={245}
              className="project-portal-image"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          <div className="project-portal-scan" />
          <div className="project-portal-target" />
          <div className="project-portal-noise" />
          <span className="project-portal-screen-label font-pixel">LIVE SAMPLE</span>
        </div>

        <div className="project-portal-copy">
          <div>
            <p className="font-pixel text-[11px] tracking-[0.16em] text-accent">
              {project.status}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {project.name}
            </h2>
            <p className="mt-1 text-sm text-muted">{project.kicker}</p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-foreground/75 sm:text-base">
            {project.summary}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="project-tag font-pixel">
                  {tag}
                </span>
              ))}
            </div>
            <span className="project-enter font-pixel" aria-hidden="true">
              ENTER LAB <span>→</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
