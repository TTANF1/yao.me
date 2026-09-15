import type { Locale } from './locale';

export interface Company {
  id: string
  name: string
  role: string
  period: string
  /** 公司维度的工作总结 */
  summary: string
}

export const companiesZh: Company[] = [
  {
    id: 'alibaba-interactive',
    name: '阿里互动开放团队',
    role: '高级前端开发工程师',
    period: '2024.01 - 至今',
    summary:
      '负责淘宝主端多款头部游戏 IP 联合运营互动 H5（单个头部 IP 上线支撑百万级 DAU）与淘宝生态开发者控制台平台（面向小游戏 / 轻应用开发者的一体化控制台）。',
  },
  {
    id: 'xingshen',
    name: '兴盛优选',
    role: '前端开发工程师',
    period: '2022 - 2024',
    summary:
      '负责供应商端 App / H5 / 小程序（接入供应商 1000+）、供应商招募 Taro 小程序，以及前端工程化工具建设（代码质量扫描、前端安全加签、青牛网格站后台）。',
  },
  {
    id: 'tanzhou',
    name: '湖南潭州教育',
    role: '前端开发工程师',
    period: '2020.07 - 2022.01',
    summary:
      '负责微信公众号 IM 管理系统（覆盖 400+ 公众号统一管控）与鲁班广告素材投放系统，支撑运营与投放团队提效。',
  },
]

export const companiesEn: Company[] = [
  {
    id: 'alibaba-interactive',
    name: 'Alibaba Interactive',
    role: 'Senior Frontend Engineer',
    period: '2024.01 - Present',
    summary:
      'Built Taobao main-app interactive H5 for co-operated game IPs (single top IP sustains millions of DAU), and the Taobao ecosystem developer console for mini-game / mini-app developers.',
  },
  {
    id: 'xingshen',
    name: 'Xingshen Preferred',
    role: 'Frontend Engineer',
    period: '2022 - 2024',
    summary:
      'Owned the supplier App / H5 / mini-program (1000+ suppliers onboarded), a supplier-onboarding Taro mini-program, and frontend engineering tooling (code-quality scanning, security signing, grid-station admin).',
  },
  {
    id: 'tanzhou',
    name: 'Hunan Tanzhou Education',
    role: 'Frontend Engineer',
    period: '2020.07 - 2022.01',
    summary:
      'Built the WeChat official-account IM management system (unified management of 400+ accounts) and the Luban ad material delivery system, streamlining operations and ad-delivery efficiency.',
  },
]

export function getCompanies(locale: Locale): Company[] {
  return locale === 'zh' ? companiesZh : companiesEn
}
