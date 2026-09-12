/**
 * 站点全局配置 —— 修改这里即可更新站名、域名、社交链接、默认语言等。
 */
export const site = {
  name: 'Yao',
  domain: 'yao.me',
  /** 正式部署前请把域名替换为真实地址（Vercel 分配域名或自定义域名）；
   *  也可通过环境变量 SITE_URL 覆盖（仅服务端使用，如 sitemap/robots/feed/metadata；
   *  客户端组件不需要该值，故不带 NEXT_PUBLIC_ 前缀以免注入浏览器）。 */
  url: process.env.SITE_URL ?? 'https://yao.me',
  defaultLocale: 'zh',
  locales: ['zh', 'en'] as const,
  social: {
    github: {
      label: 'GitHub',
      url: 'https://github.com/TTANF1',
    },
    /** 中文版邮箱 */
    emailZh: 'ttanf_1@163.com',
    /** 英文版邮箱 */
    emailEn: 'ttanf1999@gmail.com',
  },
} as const

export type Site = typeof site
