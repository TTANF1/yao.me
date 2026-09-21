import type { Locale } from './locale'

export interface PlaygroundProject {
  id: string
  name: string
  kicker: string
  summary: string
  status: string
  href: string
  tags: string[]
  beforeImage: string
  afterImage: string
}

const projects: Record<Locale, PlaygroundProject[]> = {
  zh: [
    {
      id: 'edgewise',
      name: 'Edgewise',
      kicker: '颜色归队',
      summary:
        '把散落的候选像素收成颜色组。一次判断，让同色像素沿原路归位。',
      status: 'PLAYABLE / 01',
      href: '/projects/edgewise',
      tags: ['PIXEL ART', 'JEV', 'COMPUTER VISION'],
      beforeImage: '/projects/edgewise/before.png',
      afterImage: '/projects/edgewise/after.png',
    },
  ],
  en: [
    {
      id: 'edgewise',
      name: 'Edgewise',
      kicker: 'Colors, reunited',
      summary:
        'Gather scattered candidate pixels by color. One judgment sends a whole group home.',
      status: 'PLAYABLE / 01',
      href: '/projects/edgewise',
      tags: ['PIXEL ART', 'JEV', 'COMPUTER VISION'],
      beforeImage: '/projects/edgewise/before.png',
      afterImage: '/projects/edgewise/after.png',
    },
  ],
}

export function getProjects(locale: Locale): PlaygroundProject[] {
  return projects[locale]
}
