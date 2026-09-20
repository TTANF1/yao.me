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
      kicker: '像素边缘鉴证所',
      summary:
        '观察规则引擎与 JEV 如何锁定受背景色污染的边缘像素，再把颜色拉回主体内部。',
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
      kicker: 'Pixel Forensics Lab',
      summary:
        'Watch the rule engine and Jev isolate wall-contaminated edge pixels, then pull their color back toward the subject.',
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
