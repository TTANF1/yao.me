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
- `components/`：header、nav-bar、footer、theme-provider、theme-toggle、locale-switcher、scramble-text（语言切换乱码动画）、reveal（滚动入场）、signature-watermark（首页签名水印）、project-card、post-toc、mermaid-renderer、scroll-header、scroll-to-top、icons、nav-transition-bridge（导航过渡桥接）、post-list-link（列表→详情过渡链接）、back-link（详情→列表过渡返回）
- `content/posts|notes/{zh,en}/`：文章与随记；同名文件成对 = 中英双语
- `lib/`：i18n、locale、messages（UI 文案）、posts（内容解析）、projects-data、site（站点配置：域名/社交/默认语言）、view-transition（语言切换/导航共用过渡槽位）、nav-transition（列表⇄详情导航过渡编排）、rehype-shiki（代码高亮）

## 主要功能
1. **中英双语**：路径路由；语言切换 = ViewTransition + ScrambleText 乱码洗牌动画（首帧即乱码，不等旧文案）
2. **明暗主题**：自定义"扩散-回缩-加速"圆形切换动画（参数已锁定勿动）；ThemeProvider + localStorage 持久化
3. **首页**：hero（你好我是 Yao）+ 右下角签名水印（SVG 按笔画描边动画，单次播放定格，参数用户手调过）
4. **文章/随记**：列表 + 详情（MD 渲染、shiki 高亮、TOC、mermaid）；列表 title 用 `.list-title` 下划线 hover，date muted 色，只显示 "23 min" 不显示"阅读时长"文案；**列表→详情导航视图过渡**（复刻 Chrome MPA 演示：被点击行标题⇄详情页标题 morph + 按方向滑动，仅前进方向 nav-forward；**返回按钮在长文底部、不做过渡**，走普通导航；标题 morph 时长随位移距离自适应，避免远距离高速位移掉帧）
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
9. **列表→详情导航过渡（实现要点，勿破坏时序）**：App Router 是客户端导航，无跨文档 pageswap/pagereveal——点击时（`startNavTransition`，lib/nav-transition.ts）先给被点击行 `.list-title` 临时命名 `detail-title` + 加 `vt-transition-title` 类（禁 hover 下划线 ::after，避免下划线进快照），按位移距离写 `--vt-morph-duration`（CSS 变量驱动 morph 时长，距离远则慢），剥离 `page-content`，再 `document.startViewTransition({types:['nav-forward'], update:()=>commit})` + `router.push`；新页由 layout 的 `NavTransitionBridge` 补名并兑现共享 commit（`lib/view-transition.ts` 槽位，与语言切换共用，同刻仅一过渡在途）；`vt.finished` 后清理并 dispatch `nav-transition-end`（详情页 TOC 据此在过渡落定后才响应 hover，`isNavTransitionInFlight()` 在途时锁定，1.6s 兜底解锁）。**详情页 h1 必须 `width:fit-content`**（否则 morph 帧宽度=容器 672px，短标题如"前端"会被横向拉伸畸变放大——已踩坑）；**标题 morph 动画是对称淡入淡出**（globals.css）：old 先 150ms 淡出、new 延迟 150ms 后淡入且时长 = `calc(var(--vt-morph-duration) - 150ms)`（与 group 同步结束）、group 显式 `animation-fill-mode: both`——**禁止给 old/new 设 `animation:none`**（两帧全程静止叠加=重影；new 静止+收尾切真实元素=“到位后刷新重显”，均已踩坑）；内容块 `page-content` + `data-vt-content`；过渡期间 `Reveal` 跳过滚动入场。**返回按钮（back-link.tsx）是普通 Link 无过渡**。回顶按钮（ScrollToTop）渲染在详情页 article 内、PostToc 容器外（hover 它不触发目录），footer 进入视口底部时自动抬升（bottom=footerH+24px，内联 transition bottom 300ms ease 丝滑过渡）。**ScrambleText 必须感知 `isNavTransitionInFlight()`**：导航进入详情时直接落定不洗牌——lastTexts 按 id（post-title-${slug}，不含 locale）记录上次文字，跨语言残留会让导航进入误判为"语言切换"→ 过渡期间文字每帧洗牌 → 与 morph 叠加成重影/模糊 + 主线程每帧重渲染掉帧（已踩坑）；语言切换（inFlight=false）洗牌不受影响。**MermaidRenderer 必须延迟渲染**：详情页 mount 时动态 import mermaid（~1MB）+ 解析 SVG 会阻塞主线程，与过渡动画重叠造成明显掉帧（多 mermaid 图的长文尤甚）——`isNavTransitionInFlight()` 在途时等 `nav-transition-end` 事件再渲染（2s 兜底超时）。被跳过的过渡（ready 拒绝）导航不受影响，已静默处理
10. **dev 首次编译竞态**：Turbopack 慢文件系统下，路由首次请求可能瞬时 404（编译未完成）——重试/热更新后恢复，非代码问题；验证过 git stash 对照原代码同样 200

## 内容结构约定
- frontmatter 字段：`title` / `date` / `summary` / `aiUsed`（是否使用 AI，标注在文中）等；双语同名成对
- 日期显示：中文全日期、英文缩写月份

## 当前状态
- 最近提交 `858a747`；工作区未提交批次：基础功能 14 文件 + 两轮体验修正（h1 fit-content 防畸变、下划线禁入快照、morph 时长自适应、返回取消过渡、TOC 延后、回顶按钮避让 footer+丝滑过渡、ScrambleText 导航在途跳过洗牌（修重影/乱码误播）、MermaidRenderer 延迟到过渡落定后渲染（修长文掉帧）），tsc/ESLint/浏览器实测通过；本轮又按用户反馈将标题 morph 动画改为对称淡入淡出（修重影残留与收尾“刷新重显”，CSS 实验已采纳为正式实现），**尚未 commit（需用户确认）**
- 无进行中的大任务；小改动直接按上述注意事项执行

## 维护约定（agent 必读）
- **任务完成或新增功能后，及时更新本文件**：架构/功能清单/注意事项/当前状态（含最近提交、未提交批次）要与代码同步。
- 本文件是后续任何 agent 理解项目的第一入口，保持准确比保持简短更重要；改动小到一行 CSS 也可不写，但**结构性变化、新组件/新页面/新依赖、踩坑经验、参数锁定**必须记录。
- 不要修改上方 `<!-- BEGIN:nextjs-agent-rules -->` 官方区块（由 next dev 维护）。