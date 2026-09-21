import type { CSSProperties } from 'react'
import type { PlaygroundProject } from '@/lib/projects-data'
import type { Locale } from '@/lib/locale'
import cohorts from '@/lib/edgewise-colors.json'
import Link from 'next/link'

const HUBS = [[62, 115], [62, 305], [62, 495], [938, 115], [938, 305], [938, 495]]

export default function ProjectCard({ project, locale }: { project: PlaygroundProject; locale: Locale }) {
  return (
    <Link href={`/${locale}${project.href}`} className="project-portal project-color-portal" aria-label={`${project.name}: ${project.kicker}`}>
      <article>
        <div className="project-color-preview" aria-hidden="true">
          <svg viewBox="0 0 1000 610">
            <image href="/projects/edgewise/candidates-source.png" x="157" y="60" width="686" height="490" />
            {cohorts.groups.flatMap((group, groupIndex) => group.pixels.map((pixel, index) => {
              const x = 157 + pixel.x * 2
              const y = 60 + pixel.y * 2
              return <rect key={pixel.x + '-' + pixel.y} x={x} y={y} width="6" height="6" fill={`rgb(${group.rgb.join(' ')})`}
                style={{
                  '--cohort-x': HUBS[groupIndex][0] + (index % 3 - 1) * 13 - x + 'px',
                  '--cohort-y': HUBS[groupIndex][1] + (Math.floor(index / 3) - .5) * 13 - y + 'px',
                  '--cohort-delay': index * 15 + 'ms',
                } as CSSProperties} />
            }))}
          </svg>
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
