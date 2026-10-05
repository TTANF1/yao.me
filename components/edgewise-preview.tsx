import type { CSSProperties } from 'react'
import cohorts from '@/lib/edgewise-colors.json'

const HUBS = [[62, 115], [62, 305], [62, 495], [938, 115], [938, 305], [938, 495]]

/** The same real candidate pixels are used on the workbench and the legacy preview. */
export function EdgewisePreview({ className = '' }: { className?: string }) {
  return (
    <div className={`project-color-preview ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1000 610">
        <image href="/projects/edgewise/candidates-source.png" x="157" y="60" width="686" height="490" />
        {cohorts.groups.flatMap((group, groupIndex) => group.pixels.map((pixel, index) => {
          const x = 157 + pixel.x * 2
          const y = 60 + pixel.y * 2
          return <rect key={`${pixel.x}-${pixel.y}`} x={x} y={y} width="6" height="6" fill={`rgb(${group.rgb.join(' ')})`}
            style={{
              '--cohort-x': `${HUBS[groupIndex][0] + (index % 3 - 1) * 13 - x}px`,
              '--cohort-y': `${HUBS[groupIndex][1] + (Math.floor(index / 3) - .5) * 13 - y}px`,
              '--cohort-delay': `${index * 15}ms`,
            } as CSSProperties} />
        }))}
      </svg>
    </div>
  )
}
