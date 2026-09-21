import type { Locale } from './locale'

/**
 * 中英双语词典 —— 新增文案时 zh 与 en 同步补充。
 * 类型以 zh 为准（en 必须与 zh 结构一致）。
 */
export const zh = {
  nav: { home: '首页', blog: '档案', notes: '随记', projects: '实验室', about: '关于' },
  hero: {
    greeting: '你好，我是',
    name: 'Yao',
    tagline: '前端工程师 · 内容创作者',
    intro:
      '让我们创造一点有趣的东西吧~',
  },
  posts: {
    title: '最新文章',
    empty: '文章整理中，我会在这里分享家居、动画与前端相关的思考。',
    viewAll: '查看全部文章',
    back: '返回文章列表',
    readingTime: '阅读时长',
  },
  blog: {
    title: '档案',
    empty: '还没有文章，敬请期待。',
  },
  notes: {
    title: '随记',
    empty: '还没有随记，敬请期待。',
    back: '返回随记',
  },
  projects: {
    title: '实验室',
    description: '一些为了解决问题，也为了好玩而做的东西。',
    empty: '实验场正在搭建中。',
  },
  about: {
    title: '关于',
    intro: '我是 Yao，一名摸爬滚打 6 年的前端工程师，目前还想要努力做好内容创作。',
    paragraphs: [
      '在时代更替的洪流里，想要抓住点什么，创造点什么。个人的能力究竟能做到什么程度，我想看看。',
      '把技术、设计与生活内容揉在一起。',
      '这里是我的个人网站：记录内容创作、动画、视频与前端工程的一些碎片。欢迎交流。',
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
    title: 'Yao · 前端 / 内容创作',
    description: 'Yao 的个人网站：前端开发、内容创作。',
  },
}

export type Messages = typeof zh

export const en: Messages = {
  nav: { home: 'Home', blog: 'Archive', notes: 'Notes', projects: 'Labs', about: 'About' },
  hero: {
    greeting: "Hey, I'm",
    name: 'Yao',
    tagline: 'Frontend Engineer · Content Creator',
    intro:
      "Let's make some shiiiiiiiiiiit~",
  },
  posts: {
    title: 'Latest Posts',
    empty: "Posts are being organized — I'll share thoughts on home, animation and frontend here.",
    viewAll: 'View all posts',
    back: 'Back to posts',
    readingTime: 'Reading time',
  },
  blog: {
    title: 'Archive',
    empty: 'No posts yet. Stay tuned.',
  },
  notes: {
    title: 'Notes',
    empty: 'No notes yet. Stay tuned.',
    back: 'Back to notes',
  },
  projects: {
    title: 'Labs',
    description: 'Things made to solve a problem, or simply for the fun of it.',
    empty: 'The playground is under construction.',
  },
  about: {
    title: 'About',
    intro: "I'm Yao, a frontend engineer who's been through the trenches for 6 years, now trying to get serious about content creation.",
    paragraphs: [
      "In the shifting currents of our time, I want to grab hold of something, create something. How far can one person's ability go? I want to find out.",
      'Blending technology, design and everyday life into content.',
      "This is my personal site: fragments of content creation, animation, video and frontend engineering. Feel free to say hi.",
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
    title: 'Yao · Frontend / Content Creation',
    description: "Yao's personal site: frontend development and content creation.",
  },
}

export const messages: Record<Locale, Messages> = { zh, en }
