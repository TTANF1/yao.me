import type { Locale } from './locale'

interface ProjectInfo {
  id: string
  name: string
  kicker: string
  summary: string
  status: string
  prop: 'edgewise' | 'kitchen'
  tags: string[]
  beforeImage?: string
  afterImage?: string
}

export type PlaygroundProject = ProjectInfo & (
  | { availability: 'playable'; href: string }
  | { availability: 'coming-soon'; href?: never }
)

const projects: Record<Locale, PlaygroundProject[]> = {
  zh: [
    {
      id: 'edgewise',
      prop: 'edgewise',
      availability: 'playable',
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
    {
      id: 'boo-boo-kitchen',
      prop: 'kitchen',
      availability: 'coming-soon',
      name: 'Boo Boo Kitchen',
      kicker: '大厨！你快做啊！',
      summary: '记住食材的英文，向传菜员点单，再亲手切菜、下锅。让单词变成一顿热饭。',
      status: '正在备料',
      tags: ['ENGLISH', 'COOKING', 'THREE.JS'],
    },
  ],
  en: [
    {
      id: 'edgewise',
      prop: 'edgewise',
      availability: 'playable',
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
    {
      id: 'boo-boo-kitchen',
      prop: 'kitchen',
      availability: 'coming-soon',
      name: 'Boo Boo Kitchen',
      kicker: 'A little English. A warm meal.',
      summary: 'Remember the ingredients, order in English, then chop and cook. Turn new words into a meal of your own.',
      status: 'PREPPING / COMING SOON',
      tags: ['ENGLISH', 'COOKING', 'THREE.JS'],
    },
  ],
}

export function getProjects(locale: Locale): PlaygroundProject[] {
  return projects[locale]
}
