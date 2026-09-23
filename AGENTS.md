<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


---

# Project Overview — yao.me（Yao 的个人网站）

> 本文件用于让任何新对话的 agent 快速理解项目。由用户维护，可能滞后于代码，**以代码为准**。
> 调整提示：导航过渡相关的新坑加进「关键注意事项 9」的子条目；未提交改动更新到「当前状态」；不要动上方官方区块。

## 一句话
Yao（前端工程师 + 内容创作者）的个人网站：简约克制风格，中英双语，免费路线部署（Vercel + 自有域名）。

## 技术栈
- Next.js 16（App Router + Turbopack）+ React 19 + TypeScript + Tailwind v4 + motion + GSAP（gsap + @gsap/react，Edgewise 实验场与导航过渡动画）
- 首页/header/footer 使用 Fusion Pixel 像素字体（10px 比例模式 zh-Hans 子集，OFL-1.1）
- 内容为 Markdown（`content/`），构建时解析（`lib/posts.ts`），无 CMS

## 目录架构
- `app/[locale]/`：双语路由（`/zh` `/en`）——layout（Header/Footer/主题）、page（首页）、blog、notes、projects（实验场 + `projects/edgewise` 像素鉴证 Playground）、about
- `app/`：globals.css（含手写工具类）、feed.xml/route.ts（RSS）、sitemap.ts、robots.ts
- `components/`：header、footer、theme-provider、theme-toggle、locale-switcher、scramble-text（语言切换乱码动画）、reveal（滚动入场）、signature-watermark（首页签名水印）、project-card（实验项目入口）、edgewise-playground（像素鉴证交互）、classified-archive（按年份机密档案袋）、mission-board（毛毡便签与原地全文阅读）、post-toc（左侧轮转目录）、mermaid-renderer、scroll-header、scroll-to-top、icons、nav-transition-bridge（导航过渡桥接）、post-list-link（列表→详情过渡链接）、back-link（详情→列表过渡返回）、game-home（首页）、game-transition-link / game-transition-overlay（游戏化导航过渡）
- `content/posts|notes/{zh,en}/`：文章与随记；同名文件成对 = 中英双语
- `lib/`：i18n、locale、messages（UI 文案）、posts（内容解析）、projects-data、site（站点配置：域名/社交/默认语言）、view-transition（语言切换/导航共用过渡槽位）、nav-transition（列表⇄详情导航过渡编排）、rehype-shiki（代码高亮）

## 主要功能
1. **中英双语**：路径路由；语言切换 = ViewTransition + ScrambleText 乱码洗牌动画（首帧即乱码，不等旧文案）
2. **明暗主题**：自定义"扩散-回缩-加速"圆形切换动画（参数已锁定勿动）；ThemeProvider + localStorage 持久化
3. **首页**：hero 文案用 ScrambleText 乱码洗牌动画（稳定 id，语言切换重洗牌）+ 像素风 sprite 动画（public/sprite-sheet.png，8 帧横向序列循环播放）+ 右下角签名水印（SVG 按笔画描边动画，单次播放定格，参数用户手调过）
4. **Header 导航**：sticky 毛玻璃（game-header，底部 3px 前景色粗线 + accent 斜角装饰），nav 项为 game-hud-nav 倾斜文字链接（skewX(-9deg)，前缀 i 编号用像素字体），hover 前景/背景反转；链接文字用 ScrambleText（稳定 id），语言切换洗牌
5. **文章/随记**：文章列表按年份分组为堆叠“机密档案袋”，hover 滑出该年目录、点击固定、点击外部收回；文章、随记、项目列表头部统一使用 blog 的 `classified-page` / kicker / title / lead 基线；详情保持克制阅读版式，TOC 收敛在最左侧，默认是短柱条，hover 后按当前/悬停标题形成放大—渐缩—退回柱条的轮转层级；随记采用整块毛毡背景与错落便签，只展示标题、模拟笔迹和日期；点击便签在当前页展开全文，关闭后返回原位。详情继续支持 MD、shiki、mermaid 与列表标题 morph 过渡；返回按钮在长文底部且不做过渡。
6. **项目页**：个人实验场，不再展示公司履历；Edgewise 是首个可玩项目，入口卡片循环演示扫描/前后对比，详情页提供自动巡检、代表像素放大镜、规则证据、JEV 三段式裁决、候选切换、阈值调节与 Before/After 拖动对比
7. **SEO**：sitemap、robots、RSS feed、opengraph-image
8. 404 刷新回首页

## 关键注意事项（踩过的坑，动手前必读）

1. **Tailwind v4 JIT 不自动生成新类**：新增类没生效就手写进 `app/globals.css`（已沉淀 .snap-x / .list-title 等）
2. **CRLF 环境**：Edit 工具多行替换会失败——用 PowerShell `[IO.File]::ReadAllText/WriteAllText` + `.Contains()/.Replace()`（先统一 `\n` 替换、写回 CRLF）
3. **提交铁律**：commit/push 前必须列变更摘要并获用户确认；用户拒绝的操作不得换写法重试
4. **浏览器验证**：用户接受桌面接管（CU），触发前需获得用户同意；bu 无法触发真实 CSS :hover，时序验证用 MutationObserver 挂 body
5. **用户会手动改代码/参数**：改任何文件前先 Read 当前内容（签名动画参数、nav 文案、样式均可能被用户手调过）
6. **内容流水线**：Obsidian（`D:\obsidian\YaosKnowledge`）→ 网站，走 `doubao-obsidian-post-pipeline` skill（按 frontmatter 是否标注 AI 决定去味、图片压缩迁移、可选生成英文版）
7. **部署**：Vercel + 阿里云域名 fyao.me + Cloudflare DNS（免费中转国内直连）；`SITE_URL` 环境变量（服务端用）
8. **dev/校验**：`npm run dev`（Turbopack，localhost:3000）；`npx tsc --noEmit`

9. **列表→详情导航过渡**（改动前必读，勿破坏时序）

   **9.1 核心时序**：App Router 是客户端导航，无跨文档 pageswap/pagereveal。点击时（`startNavTransition`，lib/nav-transition.ts）：
   - 给被点击行 `.list-title` 临时命名 `detail-title` + 加 `vt-transition-title` 类（禁 hover 下划线 ::after，避免下划线进快照）
   - 按位移距离写 `--vt-morph-duration`（CSS 变量驱动 morph 时长，距离远则慢）
   - 剥离 `page-content` → `document.startViewTransition({types:['nav-forward'], update:()=>commit})` + `router.push`
   - 新页由 layout 的 `NavTransitionBridge` 补名并兑现共享 commit（`lib/view-transition.ts` 槽位，与语言切换共用，同刻仅一过渡在途）
   - `vt.finished` 后清理并 dispatch `nav-transition-end`（详情页 TOC 据此在过渡落定后才响应 hover；`isNavTransitionInFlight()` 在途时锁定，1.6s 兜底解锁）

   **9.2 标题 morph 要素**：
   - 详情页 h1 必须 `width:fit-content`（否则 morph 帧宽度=容器 672px，短标题如"前端"会被横向拉伸畸变放大——已踩坑）
   - 内容块 `page-content` + `data-vt-content`；过渡期间 `Reveal` 跳过滚动入场

   **9.3 morph 动画 CSS（globals.css）**——对称淡入淡出：
   - old 先 150ms 淡出；new 延迟 150ms 后淡入，时长 = `calc(var(--vt-morph-duration) - 150ms)`（与 group 同步结束）
   - group 显式 `animation-fill-mode: both`
   - **禁止给 old/new 设 `animation:none`**：两帧全程静止叠加=重影；new 静止+收尾切真实元素="到位后刷新重显"（均已踩坑）

   **9.4 返回与回顶按钮**：
   - 返回按钮（back-link.tsx）是普通 Link，无过渡
   - 回顶按钮（ScrollToTop）渲染在详情页 article 内、PostToc 容器外（hover 它不触发目录）；footer 进入视口底部时自动抬升（bottom=footerH+24px，内联 transition bottom 300ms ease 丝滑过渡）

   **9.5 ScrambleText 必须感知 `isNavTransitionInFlight()`**：导航进入详情时直接落定不洗牌——lastTexts 按 id（post-title-${slug}，不含 locale）记录上次文字，跨语言残留会让导航进入误判为"语言切换"→ 过渡期间文字每帧洗牌 → 与 morph 叠加成重影/模糊 + 主线程每帧重渲染掉帧（已踩坑）；语言切换（inFlight=false）洗牌不受影响

   **9.6 PostToc 显示条件与形态**：以正文内容列左缘（不是外层 article）衡量剩余空间，>= 232px 时显示距视口左缘 12px 的 rail；收起命中宽 40px，展开宽度最多 280px，保证不覆盖正文。固定 36px 行高，单一 L 角选框跟随 hover/focus；distance 0/1/2 显示 17/14/12px 标题，distance 3 渐隐、4 退回短条；真实阅读位置用独立红点标记。scroll + rAF 根据所有标题位置更新当前章节，ResizeObserver 处理 Mermaid 等引起的正文尺寸变化。长目录在 rail 内滚动，完整焦点标题显示在底部定高区域。空间不足时用正文标题上方的绝对定位 details 入口，避免 hydration/过渡结束后推移标题。点击锚点保留 history.state，平滑滚动期间锁定选中章节；支持方向键/Home/End/Esc 与 reduced-motion。

   **9.7 MermaidRenderer 必须延迟渲染**：详情页 mount 时动态 import mermaid（~1MB）+ 解析 SVG 会阻塞主线程，与过渡动画重叠造成明显掉帧（多 mermaid 图的长文尤甚）——`isNavTransitionInFlight()` 在途时等 `nav-transition-end` 事件再渲染（2s 兜底超时）。被跳过的过渡（ready 拒绝）导航不受影响，已静默处理

   **9.8 代码块横向滚动（globals.css）**：
   - `.prose-y pre code` 用 `white-space: pre` + `overflow-x: auto`（滚动在 code 内部）
   - **禁止给 code 设 `min-width: max-content`**（会撑大 code 至内容宽度、溢出转移到 pre，导致依赖 pre 定位的元素随滚动位移——已踩坑）
   - `.prose-y pre` 本身不设 overflow（内容被 code 裁剪）

   **9.9 Reveal 双机制（components/reveal.tsx）**：
   - ① 浏览器前进/后退（popstate 历史导航）进入页面时跳过入场：模块级 `popNav` 标志（popstate 置 true + 1.5s setTimeout 复位），组件 `useState(popNav)` 快照，不重新播放入场
   - ② 入场动画播放期间容器 `pointer-events: none` 禁点内部链接（等动画结束才能点击跳转）：`onAnimationComplete` 置 settled + `useEffect` 1.2s 兜底超时强制放行（防 IO 未触发/动画中断导致永久锁死）
   - **注意**：render 期间调 `Date.now()` 会触发 React 19 react-hooks/purity 报错，时间窗口判断必须用事件驱动标志 + useState 快照

10. **GSAP（gsap + @gsap/react，Edgewise 实验场 / 游戏导航过渡）**（改动前必读）
   - 必须用 useGSAP + scope，动画只在客户端（useLayoutEffect 时机，绘制前执行）；不要在 useGSAP 回调里再嵌套 gsap.context（嵌套 context 不在其清理范围内，unmount/revert 时旧动画残留）
   - 不要用 useReducedMotion() 的值做 useGSAP 依赖：hydration 后它从 null 变为 false 会触发 useGSAP 重跑，新旧动画并存互相清空文本；改为回调内同步 window.matchMedia('(prefers-reduced-motion: reduce)') 读取
   - 无限 repeat（repeat: -1）的 tween 不能放进 timeline：会把 timeline 的 duration 撑成 Infinity，整条时间线停在 0 秒不推进；放在 timeline 的 onComplete 回调里用 contextSafe 单独启动
   - useGSAP 回调的 contextSafe 参数类型可为 undefined，使用前先判空（tsc 会报 TS2722）
   - StrictMode 开发态 useGSAP 双跑属正常（第二次覆盖第一次）；浏览器后台标签（visibility: hidden）rAF 被暂停时 GSAP 动画冻结是浏览器省电行为，非代码问题

11. **Fusion Pixel 像素字体（仅首页/header/footer）**（改动前必读）
   - 子集化产物：`public/fonts/fusion-pixel-10px-zh-hans.woff2`（175 字符 4.4KB，10px 比例模式 zh-Hans）
   - 生成：`scripts/font-subset/`——collect_chars.py 从 lib/messages.ts 提取 hero/nav/footer/locale/theme 的 zh+en 文案，并入 footer 静态文字、ScrambleText 符号池、数字与常用标点；fonttools 子集化时保留 `--layout-features="*"`（比例模式字距）
   - **新增/修改首页/header/footer 文案必须重跑子集化**，否则新字符回退系统字体造成字形突兀
   - @font-face 在 globals.css，仅应用于 `[data-site-header]` / `footer` / `.font-pixel`（首页 hero section）；blog/notes/projects/about 正文沿用 sans，勿扩散
   - 上游：TakWolf/fusion-pixel-font release `2026.09.01`，OFL-1.1
12. **首页像素 sprite 动画（.sprite-anim，public/sprite-sheet.png）**（改动前必读）
   - 8 帧横向序列，帧 342×266、步距 345px（含 3px 透明分隔）；用 CSS 纯动画实现（无 JS）
   - 对齐数学：`background-size: 800% 100%`（图宽=8×容器宽）时，`background-position: p%` 左移 7×容器宽×p%，帧 k 需 p = 100k/7 → 关键帧 0/14.2857/28.5714/42.8571/57.1428/71.4285/85.7142/100%，配合 `steps(1)` 段内跳变（不做插值滑动）
   - **禁止**把 position 写成等分百分比（12.5% 等）或用像素 position 配响应式宽度——都会错位
   - 尊重 prefers-reduced-motion（animation: none 停在第 1 帧）；后台标签页 CSS 动画冻结同 GSAP rAF 限制，属浏览器行为
13. **Edgewise Playground 数据边界**：
   - 演示素材来自 `D:\Project\edgewise\examples\desk8`，站点副本位于 `public/projects/edgewise/before.png|after.png`
   - 候选像素坐标、RGB 与处理后 RGBA 来自真实 `desk8` 前后帧；当前没有 JEV API 凭据，页面中的 JEV score 是明确标注的交互演示值，禁止宣传成在线/真实模型响应
   - 真正的管线先用确定性规则筛选候选，再按颜色去重交给 JEV；页面高亮的是代表像素，勿改成“JEV 逐像素扫描整张图片”的误导文案
   - Playground 的 GSAP 动画遵守注意事项 11：useGSAP + scope、回调内同步读取 reduced-motion、无嵌套 context / 无限 timeline
14. **年度档案交互（classified-archive.tsx）**：
   - 年份显式数值倒序（不能依赖 Object.entries 的数字键顺序）；桌面文件夹高 190px、重叠 82px，背板/纸边/前盖分层，目录纸在前盖下向右抽出；窄屏重叠 35px、目录向下展开。
   - 用单一 opened { year, pinned } 管理 hover/固定，仅一个年份展开。固定后 hover 其他年份不换目录；再次点击当前文件夹、关闭按钮、点击外部或 Esc 收回。离开延迟 180ms，键盘焦点仍在内部时保持预览。
   - 展开只由 data-open 驱动，禁止直接用 :hover/:focus-within 撑开目录，否则关闭后会马上重开。关闭目录设 inert，隐藏链接不能继续抢焦点；folder→sheet 区域连续，空白堆叠行 pointer-events:none。
   - 此处文案与编号使用 sans/mono，不扩大 Fusion Pixel 子集的使用范围；浅/深色各有低饱和纸色。CSS transition 可中断且支持 reduced-motion，无新增依赖。
15. **dev 首次编译竞态**：Turbopack 慢文件系统下，路由首次请求可能瞬时 404（编译未完成）——重试/热更新后恢复，非代码问题；验证过 git stash 对照原代码同样 200

16. **列表页头部一致性**：
   - blog、notes、projects 列表页共用 `classified-page`、`classified-kicker`、`classified-page-title` 和 `classified-page-lead`，保持同一内容列宽、顶部内边距、标题字号和导语间距；页面特有内容从 `clamp(3rem, 7vw, 5.5rem)` 的统一起始距离展开。
   - notes 仍在统一头部下承载毛毡便签板；projects 仍承载实验卡片。新增列表页不要恢复各自的 Tailwind 头部间距。

17. **Header / 首页文案乱码动画**：
   - 当前实际渲染路径是 `components/header.tsx` 与 `components/game-home.tsx`；Header nav item 和首页 `game-home-copy` 的 `PLAYER // 01` 之外四行文案必须使用稳定 id 的 `ScrambleText`。

18. **随记毛毡板（mission-board.tsx）**：
   - 服务端将已解析的 `contentHtml` 传给便签组件；便签不展示 summary / 阅读时长 / 任务编号，点击直接在本页阅读全文，独立详情路由仍可直接访问。
   - 原生 `dialog.showModal()` 保证顶层展示和背景 inert；Motion 从点击便签的真实位置、尺寸、旋转角展开纸张，关闭时重新测量原位（兼容 resize）。只动画纸张尺寸与位置，正文单独渐显，避免文字缩放变形；Mermaid 在展开落定后才挂载渲染器。
   - 关闭动画结束后才卸载 dialog / 解除 body 锁定并恢复滚动；父组件 effect 在源便签重新可见后恢复焦点，不能在子组件清理期间对隐藏源元素 focus。支持关闭按钮、板面空白、Esc、原生焦点约束和 reduced-motion。
   - 阅读对话框高度以内容为准：CSS height:auto + 最大高度（min(820px, 视口高 - 2×inset)），dialog 用 grid place-items:center 使纸张视觉居中，长文在 max-height 内滚动；motion 只动画 width/x/y/rotate（不动画 height），宽度变化时浏览器实时回流；关闭时显式把 height 缩回便签高度。阅读滚动区必须是在流内 flex 子项（.note-reading-area display:flex + .note-reading-scroll flex:1），高度 auto 下绝对定位会让 flex:1 坍缩为 0、正文不可见（已踩坑）。
   - `note-paper` 自带纸色 / 墨色变量，避免深色主题正文低对比；三列→两列→手机单列，全文区域单独滚动。全部使用 sans / mono，不新增像素字体字符或依赖。

## 内容结构约定
- frontmatter 字段：`title` / `date` / `summary` / `aiUsed`（是否使用 AI，标注在文中）等；双语同名成对
- 日期显示：中文全日期、英文缩写月份

## 当前状态
- **最近提交**：`c738b1e`（feat: 更新游戏页面标题样式，调整颜色混合效果）
- **未提交改动**：从 Obsidian 新增随记《我想做的是视觉传达工程师》，并补充同 slug 英文译文；随记页面改为毛毡便签板，移除摘要预览步骤，加入纸张原地展开全文与返回动画、原生阅读对话框、键盘焦点和滚动恢复、响应式及深浅色样式；notes 与 projects 列表页头部统一到 blog 的布局和视觉基线；恢复 Header nav item 与首页 hero 文案的中英切换乱码动画。清理未使用组件（nav-bar、hero-typewriter 已删）与其专属 CSS（nav-card / no-scrollbar / nav-fade / type-cursor / road / sig-watermark / game-page），随记阅读对话框改为内容高度 + 最大高度并保持视觉居中。

## 维护约定（agent 必读）
- **任务完成或新增功能后，及时更新本文件**：架构/功能清单/注意事项/当前状态（含最近提交、未提交批次）要与代码同步。
- 本文件是后续任何 agent 理解项目的第一入口，保持准确比保持简短更重要；改动小到一行 CSS 也可不写，但**结构性变化、新组件/新页面/新依赖、踩坑经验、参数锁定**必须记录。
- 不要修改上方 `<!-- BEGIN:nextjs-agent-rules -->` 官方区块（由 next dev 维护）。