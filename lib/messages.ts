import type { Locale } from './locale'

/**
 * 中英双语词典 —— 新增文案时 zh 与 en 同步补充。
 * 类型以 zh 为准（en 必须与 zh 结构一致）。
 */
export const zh = {
  nav: { home: '首页', blog: '文章', notes: '随记', projects: '作品', about: '关于' },
  hero: {
    greeting: '你好，我是',
    name: 'Yao',
    tagline: '前端工程师 · 家居内容创作者 · 轻动画 IP',
    intro:
      '在小屋里折腾家居与视频，也偶尔写代码、做点轻量动画。把从空屋到理想家的过程，慢慢记录下来。',
  },
  what: {
    title: '我在做什么',
    items: [
      {
        title: '前端工程',
        desc: '6 年高级前端工程师，Vue / React 双线，主导过百万级 DAU 的游戏化互动项目。',
      },
      {
        title: '家居内容',
        desc: '在小屋里做家居改造与布置，记录从空屋到理想家的过程。',
      },
      {
        title: '轻动画 IP',
        desc: '设计并运营轻量动画角色，用短内容讲故事。（内容整理中）',
      },
    ],
  },
  works: {
    title: '精选作品',
    empty: '作品集整理中，敬请期待。',
  },
  posts: {
    title: '最新文章',
    empty: '文章整理中，我会在这里分享家居、动画与前端相关的思考。',
    viewAll: '查看全部文章',
    back: '返回文章列表',
    readingTime: '阅读时长',
  },
  socials: { title: '社交' },
  blog: {
    title: '文章',
    description: '关于家居、轻动画与前端工程的一些记录。',
    empty: '还没有文章，敬请期待。',
  },
  notes: {
    title: '随记',
    description: '随手记下的一些想法与碎片。',
    empty: '还没有随记，敬请期待。',
    back: '返回随记',
  },
  projects: {
    title: '作品',
    description: '轻动画 IP 与家居内容的作品集。（内容整理中）',
    empty: '作品集整理中，敬请期待。',
  },
  about: {
    title: '关于',
    intro: '我是 Yao，一名 6 年经验的前端工程师，目前在做家居内容与轻动画 IP。',
    paragraphs: [
      '白天写代码，晚上折腾家居。正在把我的小家它变成理想中的样子，也把过程记录下来。',
      '曾主导过百万级 DAU 的游戏化互动项目，Vue 与 React 双线开发。现在想把技术、设计与生活内容揉在一起。',
      '这里是我的个人网站：记录内容创作、动画 IP 与前端工程的一些碎片。欢迎交流。',
    ],
    contact: '联系我',
    contactHint: '合作、交流或单纯想聊聊，都可以发邮件给我：',
    emailZhLabel: '中文邮箱',
    emailEnLabel: 'English Email',
  },
  footer: {
    rights: '保留所有权利',
    builtWith: 'Built with Next.js',
    rss: 'RSS',
  },
  theme: { toggle: '切换主题' },
  locale: { switchTo: '切换语言' },
  seo: {
    title: 'Yao · 家居 / 轻动画 / 前端',
    description: 'Yao 的个人网站：家居内容、轻动画 IP 与前端工程。',
  },
}

export type Messages = typeof zh

export const en: Messages = {
  nav: { home: 'Home', blog: 'Blog', notes: 'Notes', projects: 'Works', about: 'About' },
  hero: {
    greeting: "Hey, I'm",
    name: 'Yao',
    tagline: 'Home Content · Light Animation IP · Frontend Engineer',
    intro:
      'Tinkering with home decor and videos in a lil house in Changsha, occasionally writing code and making lightweight animations. Slowly documenting the journey from empty space to home.',
  },
  what: {
    title: 'What I do',
    items: [
      {
        title: 'Frontend Engineering',
        desc: 'Senior frontend engineer with 6 years of experience across Vue and React, leading gamified interactive projects with millions of DAU.',
      },
      {
        title: 'Home Content',
        desc: 'Renovating and styling a lil house in Changsha, documenting the journey from empty space to home.',
      },
      {
        title: 'Light Animation IP',
        desc: 'Designing and running lightweight animated characters, telling stories in short-form content. (WIP)',
      },
    ],
  },
  works: {
    title: 'Featured Works',
    empty: 'Portfolio is being prepared. Stay tuned.',
  },
  posts: {
    title: 'Latest Posts',
    empty: 'Posts are coming soon — thoughts on home decor, animation and frontend.',
    viewAll: 'View all posts',
    back: 'Back to posts',
    readingTime: 'Reading time',
  },
  socials: { title: 'Socials' },
  blog: {
    title: 'Blog',
    description: 'Notes on home decor, light animation and frontend engineering.',
    empty: 'No posts yet. Stay tuned.',
  },
  notes: {
    title: 'Notes',
    description: 'Random thoughts and fragments.',
    empty: 'No notes yet. Stay tuned.',
    back: 'Back to notes',
  },
  projects: {
    title: 'Works',
    description: 'Portfolio of light animation IP and home content. (WIP)',
    empty: 'Portfolio is being prepared. Stay tuned.',
  },
  about: {
    title: 'About',
    intro: "I'm Yao, a frontend engineer with 6 years of experience, currently working on home content and light animation IP.",
    paragraphs: [
      'I write code during the day and tinker with home decor at night. In Changsha, I have a lil house that I am turning into my ideal home — and documenting the process.',
      'I previously led gamified interactive projects with millions of DAU, working across both Vue and React. Now I am interested in blending technology, design and life content.',
      'This is my personal site: fragments of content creation, animation IP and frontend engineering. Feel free to reach out.',
    ],
    contact: 'Contact',
    contactHint: 'For collaboration, conversation or anything else, email me at:',
    emailZhLabel: '中文邮箱',
    emailEnLabel: 'English Email',
  },
  footer: {
    rights: 'All rights reserved',
    builtWith: 'Built with Next.js',
    rss: 'RSS',
  },
  theme: { toggle: 'Toggle theme' },
  locale: { switchTo: 'Switch language' },
  seo: {
    title: 'Yao · Home / Animation / Frontend',
    description: "Yao's personal site: home content, light animation IP and frontend engineering.",
  },
}

export const messages: Record<Locale, Messages> = { zh, en }
