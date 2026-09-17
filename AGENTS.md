<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


---

# Project Overview — yao.me（Yao 的个人网站）

> 本文件用于让任何新对话的 agent 快速理解项目。由用户维护，可能滞后于代码，**以代码为准**。

## 一句话
Yao（前端工程师 + 内容创作者）的个人网站：简约克制风格，中英双语，免费路线部署（Vercel + 自有域名）。

## 技术栈
- Next.js 16（App Router + Turbopack）+ React 19 + TypeScript + Tailwind v4 + motion
- 内容为 Markdown（`content/`），构建时解析（`lib/posts.ts`），无 CMS

## 目录架构
- `app/[locale]/`：双语路由（`/zh` `/en`）——layout（Header/Footer/主题）、page（首页）、blog、notes、projects、about
- `app/`：globals.css（含手写工具类）、feed.xml/route.ts（RSS）、sitemap.ts、robots.ts
- `components/`：header、nav-bar、footer、theme-provider、theme-toggle、locale-switcher、scramble-text（语言切换乱码动画）、reveal（滚动入场）、signature-watermark（首页签名水印）、project-card、post-toc、mermaid-renderer、scroll-header、scroll-to-top、icons
- `content/posts|notes/{zh,en}/`：文章与随记；同名文件成对 = 中英双语
- `lib/`：i18n、locale、messages（UI 文案）、posts（内容解析）、projects-data、site（站点配置：域名/社交/默认语言）、view-transition、rehype-shiki（代码高亮）

## 主要功能
1. **中英双语**：路径路由；语言切换 = ViewTransition + ScrambleText 乱码洗牌动画（首帧即乱码，不等旧文案）
2. **明暗主题**：自定义"扩散-回缩-加速"圆形切换动画（参数已锁定勿动）；ThemeProvider + localStorage 持久化
3. **首页**：hero（你好我是 Yao）+ 右下角签名水印（SVG 按笔画描边动画，单次播放定格，参数用户手调过）
4. **文章/随记**：列表 + 详情（MD 渲染、shiki 高亮、TOC、mermaid）；列表 title 用 `.list-title` 下划线 hover，date muted 色，只显示 "23 min" 不显示"阅读时长"文案
5. **项目页**：按公司维度的极简卡片流（ProjectCard + Reveal），无 tags/highlights
6. **SEO**：sitemap、robots、RSS feed、opengraph-image
7. 404 刷新回首页

## 关键注意事项（踩过的坑，动手前必读）
1. **Tailwind v4 JIT 不自动生成新类**：新增类没生效就手写进 `app/globals.css`（已沉淀 .sig-watermark / .snap-x / .list-title 等）
2. **CRLF 环境**：Edit 工具多行替换会失败——用 PowerShell `[IO.File]::ReadAllText/WriteAllText` + `.Contains()/.Replace()`（先统一 `\n` 替换、写回 CRLF）
3. **提交铁律**：commit/push 前必须列变更摘要并获用户确认；用户拒绝的操作不得换写法重试
4. **浏览器验证**：用户拒绝桌面接管（CU），只走 `bu`（seed_browser_use）；bu 无法触发真实 CSS :hover，时序验证用 MutationObserver 挂 body
5. **用户会手动改代码/参数**：改任何文件前先 Read 当前内容（签名动画参数、nav 文案、样式均可能被用户手调过）
6. **内容流水线**：Obsidian（`D:\obsidian\YaosKnowledge`）→ 网站，走 `doubao-obsidian-post-pipeline` skill（按 frontmatter 是否标注 AI 决定去味、图片压缩迁移、可选生成英文版）
7. **部署**：Vercel + 阿里云域名 fyao.me + Cloudflare DNS（免费中转国内直连）；`SITE_URL` 环境变量（服务端用）
8. **dev/校验**：`npm run dev`（Turbopack，localhost:3000）；`npx tsc --noEmit`

## 内容结构约定
- frontmatter 字段：`title` / `date` / `summary` / `aiUsed`（是否使用 AI，标注在文中）等；双语同名成对
- 日期显示：中文全日期、英文缩写月份

## 当前状态
- 工作区干净，最近提交 `858a747`（功能已基本齐备，后续主要是内容更新与体验打磨）
- 无进行中的大任务；小改动直接按上述注意事项执行

## 维护约定（agent 必读）
- **任务完成或新增功能后，及时更新本文件**：架构/功能清单/注意事项/当前状态（含最近提交、未提交批次）要与代码同步。
- 本文件是后续任何 agent 理解项目的第一入口，保持准确比保持简短更重要；改动小到一行 CSS 也可不写，但**结构性变化、新组件/新页面/新依赖、踩坑经验、参数锁定**必须记录。
- 不要修改上方 `<!-- BEGIN:nextjs-agent-rules -->` 官方区块（由 next dev 维护）。