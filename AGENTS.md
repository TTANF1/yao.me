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
- Next.js 16（App Router + Turbopack）+ React 19 + TypeScript + Tailwind v4 + motion + GSAP（gsap + @gsap/react，Edgewise 实验室与导航过渡动画）
- 内页 header/footer 使用 Fusion Pixel 像素字体（10px 比例模式 zh-Hans 子集，OFL-1.1）；红黑海报首页及其 header 使用 sans/mono
- 内容为 Markdown（`content/`），构建时解析（`lib/posts.ts`），无 CMS

## 目录架构
- `app/[locale]/`：双语路由（`/zh` `/en`）——layout（Header/Footer/主题）、page（首页）、blog、notes、projects（实验室 + `projects/edgewise` 像素鉴证 Playground）、about
- `app/`：globals.css（含手写工具类）、feed.xml/route.ts（RSS）、sitemap.ts、robots.ts、api/support/route.ts（About AI 客服接口）
- `components/`：header、footer、theme-provider、theme-toggle、locale-switcher、scramble-text（语言切换乱码动画）、reveal（滚动入场）、signature-watermark（首页签名水印）、project-card（旧版实验入口）、lab-workbench（手绘实验台列表与分层物件）、edgewise-preview（共用像素归组预览）、edgewise-playground（像素鉴证交互）、classified-archive（按年份机密档案袋）、mission-board（毛毡便签与原地全文阅读）、post-toc（左侧轮转目录）、mermaid-renderer、scroll-header、scroll-to-top、icons、nav-transition-bridge（导航过渡桥接）、post-list-link（列表→详情过渡链接）、back-link（详情→列表过渡返回）、game-home + game-home.module.css（红黑海报首页、分层视差与首次入场）、game-transition-link / game-transition-overlay（游戏化导航过渡）、support-chat + support-chat.module.css（About 页 AI 客服悬浮球/面板）
- `content/posts|notes/{zh,en}/`：文章与随记；同名文件成对 = 中英双语
- `lib/`：i18n、locale、messages（UI 文案）、posts（内容解析）、projects-data、site（站点配置：域名/社交/默认语言）、view-transition（语言切换/导航共用过渡槽位）、nav-transition（列表⇄详情导航过渡编排）、rehype-shiki（代码高亮）、support/（api.ts 服务端 FastAPI 代理与 types.ts 接口类型）
- `.codex/boo-boo-kitchen/`：Boo Boo Kitchen 英语烹饪游戏设计入口（README.md）及玩法、美术、架构、Roadmap；用户已选 Three.js 路线，当前仅设计，尚未创建游戏路由或安装依赖。建议固定正交视角、三维厨房配二维手绘角色，按 M0–M5 完成首道菜，M6 扩展。
- `games/boo-boo-kitchen/` 与 `public/games/boo-boo-kitchen/`：已建立游戏逻辑（scene/gameplay/data/services）与运行素材（models/textures/sprites/audio）目录骨架；游戏逻辑尚未实现且未安装 Three.js；列表已采用手绘实验台，厨房锅具是可选中介绍的待开发展示物，无游戏链接。

## 主要功能
1. **中英双语**：路径路由；语言切换 = ViewTransition + ScrambleText 乱码洗牌动画（首帧即乱码，不等旧文案）
2. **明暗主题**：自定义"扩散-回缩-加速"圆形切换动画（参数已锁定勿动）；ThemeProvider + localStorage 持久化
3. **首页**：红黑街头动漫海报布局（左侧自我介绍、中间透明人物、右侧四项斜切菜单），人物来自用户提供的透明 PNG；CSS 绘制斜切色块、网点与速度线。鼠标位移驱动轻微镜头旋转和背景/人物/文案/菜单的差速位移；GSAP 在当前文档首次访问首页时错峰入场，语言切换与站内返回不重播。hero 与菜单使用稳定 id 的 ScrambleText，保留语言切换、主题切换及签名水印。移动端改为上方人物/文案、下方菜单，触屏与 reduced-motion 禁用视差。旧 sprite 素材/样式保留供其他用途，首页已不再引用。
4. **Header 导航**：sticky 毛玻璃（game-header，底部 3px 前景色粗线 + accent 斜角装饰），nav 项为 game-hud-nav 倾斜文字链接（skewX(-9deg)，前缀 i 编号用像素字体），hover 前景/背景反转；链接文字用 ScrambleText（稳定 id），语言切换洗牌
5. **文章/随记**：文章列表按年份分组为堆叠“机密档案袋”，hover 滑出该年目录、点击固定、点击外部收回；文章、随记、项目列表头部统一使用 blog 的 `classified-page` / kicker / title / lead 基线；详情保持克制阅读版式，TOC 收敛在最左侧，默认是短柱条，hover 后按当前/悬停标题形成放大—渐缩—退回柱条的轮转层级；随记采用整块毛毡背景与错落便签，只展示标题、模拟笔迹和日期；点击便签在当前页展开全文，关闭后返回原位。详情继续支持 MD、shiki、mermaid 与列表标题 morph 过渡；返回按钮在长文底部且不做过渡。
6. **项目页**：个人实验室，不再展示公司履历；列表使用独立全景布局与用户提供的桌面、机器、锅身和锅盖 PNG；紧凑标题（1.8–2.6rem）与导语、物件标签已恢复，介绍改为上方想法气泡，桌面原比例完整展示。机器透明屏幕嵌入像素预览，hover/focus 显示介绍，点击机器直接进入 Edgewise；厨房尚未可玩，无链接，词汇只在鼠标移入时挂载并播放、移出立即卸载。支持键盘链接和 reduced-motion。Edgewise 是首个可玩项目，详情页提供自动巡检、代表像素放大镜、规则证据、JEV 三段式裁决、候选切换、阈值调节与 Before/After 拖动对比
7. **SEO**：sitemap、robots、RSS feed、opengraph-image
8. 404 刷新回首页
9. **About AI 客服（2026-10-26，分支 `codex/agent-support`）**：`/zh|en/about` 右下角悬浮球 + 可展开面板；浏览器 `components/support-chat.tsx` → Next.js `POST /api/support` → 本机 Docker Python FastAPI `POST /api/v1/chat`。Python 独占检索、模型调用、数据库和会话历史；浏览器仅传 `{message, sessionId?, locale}`，不传 history，代理将 `session_id` / 来源行号转换为既有 UI 的 camelCase。`[n]` 引用与来源卡、About 专属样式保留。Next 仅用服务端 `SUPPORT_API_BASE_URL` / `SUPPORT_SITE_TOKEN`，单次上游最长 90 秒、`maxDuration=120`、不重试，进程内限流 5 次/分钟/IP。旧 TS Agent、检索、提示词及静态知识快照已删除。

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

10. **GSAP（gsap + @gsap/react，Edgewise 实验室 / 游戏导航过渡）**（改动前必读）
   - 必须用 useGSAP + scope，动画只在客户端（useLayoutEffect 时机，绘制前执行）；不要在 useGSAP 回调里再嵌套 gsap.context（嵌套 context 不在其清理范围内，unmount/revert 时旧动画残留）
   - 不要用 useReducedMotion() 的值做 useGSAP 依赖：hydration 后它从 null 变为 false 会触发 useGSAP 重跑，新旧动画并存互相清空文本；改为回调内同步 window.matchMedia('(prefers-reduced-motion: reduce)') 读取
   - 无限 repeat（repeat: -1）的 tween 不能放进 timeline：会把 timeline 的 duration 撑成 Infinity，整条时间线停在 0 秒不推进；放在 timeline 的 onComplete 回调里用 contextSafe 单独启动
   - useGSAP 回调的 contextSafe 参数类型可为 undefined，使用前先判空（tsc 会报 TS2722）
   - StrictMode 开发态 useGSAP 双跑属正常（第二次覆盖第一次）；浏览器后台标签（visibility: hidden）rAF 被暂停时 GSAP 动画冻结是浏览器省电行为，非代码问题

11. **Fusion Pixel 像素字体（仅首页/header/footer）**（改动前必读）
   - 子集化产物：`public/fonts/fusion-pixel-10px-zh-hans.woff2`（175 字符 4.4KB，10px 比例模式 zh-Hans）
   - 生成：`scripts/font-subset/`——collect_chars.py 从 lib/messages.ts 提取 hero/nav/footer/locale/theme 的 zh+en 文案，并入 footer 静态文字、ScrambleText 符号池、数字与常用标点；fonttools 子集化时保留 `--layout-features="*"`（比例模式字距）
   - **新增/修改首页/header/footer 文案必须重跑子集化**，否则新字符回退系统字体造成字形突兀
   - @font-face 在 globals.css，应用于内页 `[data-site-header]` / `footer` / `.font-pixel`；海报首页及其 header 覆盖为 sans/mono；blog/notes/projects/about 正文沿用 sans，勿扩散
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
   - notes 仍在统一头部下承载毛毡便签板。projects 现按用户要求例外：使用 lab-workbench.module.css 独立全景布局，使用独立紧凑标题与导语，避免 classified-page 的宽度和顶部留白；桌面图禁止放大裁切。

17. **Header / 首页文案乱码动画**：
   - 当前实际渲染路径是 `components/header.tsx` 与 `components/game-home.tsx`；Header nav item、首页自我介绍的四行文案与四个菜单标题必须使用稳定 id 的 `ScrambleText`，`PLAYER // 01` 保持静态。

18. **随记毛毡板（mission-board.tsx）**：
   - 服务端将已解析的 `contentHtml` 传给便签组件；便签不展示 summary / 阅读时长 / 任务编号，点击直接在本页阅读全文，独立详情路由仍可直接访问。
   - 原生 `dialog.showModal()` 保证顶层展示和背景 inert；Motion 从点击便签的真实位置、尺寸、旋转角展开纸张，关闭时重新测量原位（兼容 resize）。只动画纸张尺寸与位置，正文单独渐显，避免文字缩放变形；Mermaid 在展开落定后才挂载渲染器。
   - 关闭动画结束后才卸载 dialog / 解除 body 锁定并恢复滚动；父组件 effect 在源便签重新可见后恢复焦点，不能在子组件清理期间对隐藏源元素 focus。支持关闭按钮、板面空白、Esc、原生焦点约束和 reduced-motion。
   - 阅读对话框高度以内容为准：CSS height:auto + 最大高度（min(820px, 视口高 - 2×inset)），dialog 用 grid place-items:center 使纸张视觉居中，长文在 max-height 内滚动；motion 只动画 width/x/y/rotate（不动画 height），宽度变化时浏览器实时回流；关闭时显式把 height 缩回便签高度。阅读滚动区必须是在流内 flex 子项（.note-reading-area display:flex + .note-reading-scroll flex:1），高度 auto 下绝对定位会让 flex:1 坍缩为 0、正文不可见（已踩坑）。
   - `note-paper` 自带纸色 / 墨色变量，避免深色主题正文低对比；三列→两列→手机单列，全文区域单独滚动；滚动条默认透明，滚动时 100ms 显示，停止 900ms 后用 350ms 渐隐，仅改变 scrollbar-color 保持内容宽度稳定，卸载时清理计时器，支持 reduced-motion。标题使用 LXGW Marker Gothic Regular 裁剪字体，正文和日期继续使用 sans / mono；PC（>=900px）阅读滚动区左右内边距为 48px。新增或修改随记标题后须运行 scripts/font-subset/subset_note_titles.py（详见同目录 README），覆盖双语标题、ASCII 和乱码符号，许可证随字体保留。

19. **实验台列表（lab-workbench.tsx / .module.css）**：
   - 游戏导航进入 /zh|en/projects 时，遮罩在退场前等待目标 data-lab-route 挂载及 data-lab-asset 图片加载/decode（lib/lab-transition-ready.ts）。四张 PNG 使用 eager，移动端不等待隐藏桌面图。缓存立即通过，错误放行，15s 兜底；卸载取消监听与等待。其他路由与 reduced-motion 保持原逻辑，直接刷新不新增全局过场。
   - 主体美术使用 public/games/main 下用户提供的桌面、机器、锅身和锅盖 PNG；原图均保留，next/image 按 sizes 优化交付。
   - 机器图 1536×1024 的屏幕开口使用百分比定位、skew 与裁切叠加 EdgewisePreview；替换机器资产后必须重新核对位置，不能只调整整个物件宽度。
   - 删除 lab-readout/notebook，介绍改为各 object 内上方的想法气泡（hover/focus-within 显示），以 left:50%/bottom:100% 相对定位，自动跟随用户手调位置。Edgewise 点击直接进入且禁止预取；保留 objectLabel。锅具词汇仅在鼠标 hover 时挂载，移出卸载以避免暂停在可见帧；后台/离开视口暂停，支持 reduced-motion。
   - 厨房 availability=coming-soon 不提供链接；仅 playable 类型有 href。列表不加载 Three.js 或厨房游戏素材。不要为了介绍入口新增空白游戏路由。
   - PC 桌面 width:120%/left:-10% 是用户锁定的最佳展示尺寸，禁止自行改为100%。页面宽度限制为 min(1400px,83.333333%)，为两侧桌角预留空间，无横向裁切。stage 高度 calc(50cqw + 100px)，tableFrame 高度 calc(29.577465cqw + 100px) 保留底部额外100px。移动端恢复页面100%宽与流式布局。
   - 移动端（<=700px）隐藏桌面背景，物件与想法气泡改为纵向流式布局；气泡预留高度，避免显示时推移物件。scroll/resize 经 rAF 在视口中部 20%–80% 选择最靠近中心的物件，data-scroll-active 驱动气泡、像素归组、锅盖与单词动画，离开取消；监听与 rAF 在卸载时清理。桌面维持 hover/focus 交互与手调位置。

20. **红黑海报首页（game-home.tsx / .module.css）**：
   - 人物为 `public/images/home/yao-street-portrait.png`（1402×1122，保留用户原始透明素材与左右透明边距）；使用 next/image eager + fetchPriority。不要用整张参考设计图替代真实文字、菜单或分层背景。
   - `data-home-scene` 是首页专属标识。globals.css 用 `body:has([data-home-scene])` 将共用 header 改为透明悬浮、隐藏重复 HUD 导航、调整 logo 和工具；离开首页自动恢复内页 header。首页使用 sans/mono 匹配参考稿，未修改双语原文或 Fusion Pixel 字符集。
   - GSAP 入场只操作内层 `data-home-*`；视差只操作外层 depth/camera，避免 transform 相互覆盖。人物的百分比居中壳与菜单的响应式 rotate/translate 壳也不能直接交给 GSAP：GSAP 会把独立变换折算为首帧像素值并留下内联样式，导致 resize 后人物偏移、菜单保留旧角度；须动画内部无定位变换的独立 wrapper。useGSAP + scope 负责 revert；人物 decode 后启动，1.4s 兜底，键盘 focus 或动态开启 reduced-motion 直接落定。模块变量记录本次文档已完成入场，语言切换/站内返回不重播，刷新可重播。CSS scripting 媒体查询配合 data-home-ready 避免 hydration 前静态完成帧闪现，2.5s 可见性兜底保证脚本异常时可读；无 JS / reduced-motion 直接展示。
   - 视差范围：镜头 rotateX ±0.55° / rotateY ±0.85°，背景反向 7/5px、人物 20/13px、文案 9/6px、菜单 12/8px。rAF 指数阻尼，停稳停止请求；移出窗口回正，后台/失焦/离开视口停止，卸载清理监听与 observer。仅 fine pointer + hover + no-preference 启用。
   - <=800px 使用纵向海报布局，<=480px 再压缩人物与文案；菜单独立可点击，不用鼠标 hover 才能显示。主题切换原有圆形动画参数与签名笔画参数保持原值。
   - PC（>=801px）首页固定 100dvh（100svh 兜底），取消原 680px 最小高度，隐藏 body 直属的默认 .game-footer；版权在左下角以 10px/0.5 opacity 弱化，GitHub/Email/RSS 在人物脚边右侧。Footer 的 variant="home" 由服务端 page 传入 GameHome 的 footer 插槽，复用默认页脚的链接与双语邮箱逻辑。只隐藏默认 footer，不能误隐藏内嵌 footer。<=800px 保留原纵向布局、独立 footer 与正常页面滚动，隐藏内嵌 footer；禁止全局 overflow:hidden 强行裁剪内容。主题切换按钮使用 cursor:pointer，圆形切换参数保持不变。

21. **About AI 客服接入（support-chat / lib/support）**：
   - 活动部署链：浏览器 → Next.js `/api/support` → Docker Python FastAPI `/api/v1/chat`；Python 工程 `D:\Project\knowledge-support-agent` 管理公开知识检索、LLM、SQLite 数据及历史。网站只保留 `api.ts` 服务端代理和 `types.ts` 接口类型；旧 TS Agent、BM25/RRF 检索、提示词、静态知识快照及其专属类型已按用户要求删除，知识与模型逻辑统一由 Python 管理。
   - 必须显式配置服务端 `SUPPORT_API_BASE_URL` 与 `SUPPORT_SITE_TOKEN`，缺失时返回通用 503；本机 Next 开发可用 `http://127.0.0.1:8787`。代理用 `X-Site-Token` 认证，禁止 `NEXT_PUBLIC_`、浏览器直连 Python、组件内密钥或日志输出密钥。网站无需模型 API key。`.env.example` 只含脱敏模板，真实值放忽略的 `.env.local` / 部署环境。
   - **Vercel 无法访问工作站 localhost**：生产/预览环境的 base URL 必须改为可达的 HTTPS 隧道或服务地址，由 Vercel 服务端通过共享 token 访问本机 Docker。隧道、Docker 和公网入口需要用户自行部署；本批次未实际开通或配置任何隧道服务。域名、TLS 与上游连通性不能靠前端 localhost 配置解决。
   - 请求 `{message, sessionId?, locale:'zh'|'en'}`，Python 使用 `session_id`；不接受客户端 history。会话 ID 仅保存在组件内存，清空会话会清 ID、abort 在途请求并用请求身份检查丢弃迟到响应；刷新/新标签开启新会话，但不会删除 Python 已存历史。网络取消不保证 Python 回滚已持久化的请求，因此不得自动重试 POST。
   - 输入最多 2000 字符、JSON 流最多 16 KiB；代理校验 locale/session、限制响应大小、上游超时 90 秒、Next `maxDuration=120`。只请求一次，错误只给稳定 code，不透传上游响应正文、机器路径或鉴权细节。GET 实际查询 `/api/v1/health`，仅返回 status 与 rag/llm/store 布尔就绪状态，不公开配置路径、模型名或数据库计数。
   - 限流是进程内有界 Map（POST/GET 共用 5 次/分钟/IP），多实例/冷启动不共享；公开流量大时应在 Vercel Firewall 或网关加共享限流。部署平台需要支持 120 秒函数时长，Next 声明本身不提升套餐上限。
   - 域名限制（2026-10-26）：verifyOrigin 要求请求必须携带 Origin 且命中白名单（默认 https://fyao.me、https://www.fyao.me，SUPPORT_ALLOWED_ORIGINS 可追加，非生产额外放行 http://localhost:3000），缺失或不在白名单返回 403 bad_origin/forbidden_origin；lib/support/api.ts 代理会把浏览器 Origin 透传给上游 FastAPI（上游同样严格校验 Origin，白名单配置在 Python 端 config/docker/agent.toml）。
   - 引用编号/合并由 Python 负责；网站只转换来源 `start_line/end_line` 为 `startLine/endLine`，显示公开相对路径，不重新编号。组件只在 about 页挂载；要全站挂载需用户确认，并检查首页红黑 header / 游戏过渡的 z-index 与交互。

## 内容结构约定
- frontmatter 字段：`title` / `date` / `summary` / `aiUsed`（是否使用 AI，标注在文中）等；双语同名成对
- 日期显示：中文全日期、英文缩写月份

## 当前状态
- **页脚发布批次（2026-10-18）**：仅 PC 首页将 Footer 功能融入主体，左下角弱化版权、人物脚右侧社交入口，消除纵向滚动；移动端保持原布局与独立 footer、允许滚动。Footer 新增 home variant，通过首页服务端插槽复用链接；主题切换按钮新增 cursor:pointer。用户验证通过，已确认提交并推送 main；无其他未提交改动。
- **页脚调整验证**：TypeScript、涉及文件 ESLint、diff 检查及 Webpack 生产构建通过；浏览器确认 PC 1280×800 / 900×600 的 scrollHeight 等于视口高，390×844 手机保留 1123px 页面与独立 footer，主题按钮 cursor 为 pointer；中文/英文邮箱正确，进入内页恢复独立 footer。
- **首页发布批次（2026-10-18）**：开发分支 `codex/street-portrait-home`，用户已确认提交并合并到 `main` 后推送，沿用 Vercel Git 自动部署。
- **About AI 客服批次（2026-10-26，未提交）**：分支 `codex/agent-support`；原有 About 悬浮球/面板/来源卡保留，活动 `/api/support` 已切换为 `lib/support/api.ts` → Docker Python FastAPI。浏览器仅传 message/sessionId/locale，Python 管理数据库/历史；清空会话中止在途请求并丢弃迟到响应。旧 `agent.ts`、`retrieval.ts`、`prompts.ts`、`knowledge.json` 原地保留且未改动，不再被活动路由导入；types.ts 兼容旧实现。新增脱敏 `.env.example` 及对应 ignore 例外，真实环境变量须私下配置。未 commit/push。
- **AI 客服上线运维批次（2026-10-26，未提交）**：前后端限流统一为 5 次/分钟/IP（Next route.ts RATE_LIMIT=5 + Python agent.toml rate_limit_per_minute=5，镜像内生效）；FastAPI 新增结构化业务日志（chat/stream/feedback 路由，仅容器 stdout 可见：Docker Desktop → Containers → Logs，含 session/status/intent/sources/tokens/latency/trace，question/answer 截断，不泄密钥路径）；双层 Origin 域名校验（Next verifyOrigin + Python restrict_origin 严格模式，缺失 Origin 即 403；compose healthcheck 已自带 Origin 头）；Cloudflare Tunnel yao-agent 已配置路由 api.fyao.me → http://127.0.0.1:8787（Healthy）。Vercel 环境变量 SUPPORT_API_BASE_URL / SUPPORT_SITE_TOKEN 需在 Settings → Environment Variables 配置（Secret）并重新部署（待确认）；公网全链路验收待部署后执行。未 commit/push。
- **AI 客服本批次验证**：`npx tsc --noEmit`、涉及代理/类型/组件的 ESLint、`git diff --check`、`npx next build --webpack` 全部通过（38 静态页面 + 动态 `/api/support`）。真实本地假 HTTP 上游的 25 项 route-handler smoke 验证通过：鉴权、会话/引用/usage 转换、health 脱敏、history 拒绝、校验/流式大小限制、缺配置、错误/路径脱敏、重定向拒绝、取消、限流和不重试；90 秒超时分支仅在测试 harness 中缩短计时，覆盖响应头及正文阶段。2026-10-26 已验证真实本机 Docker 链路：Next.js health 返回 200、一次真实问答和同会话追问均 200/answered 且带来源，Python SQLite 记录 1 个会话/4 则消息；无 token 直接调用 Python 返回 401，About 页 HTTP 200。已获授权建立被忽略的 `.env.local`，只含 Python 地址与共享服务 token，不含模型密钥。未做本批次浏览器自动化；隧道/Vercel 公网链路尚未接入。
- **AI 客服部署**：本机 Docker Python 服务监听映射端口 8787，网站服务端必须显式配置 `SUPPORT_API_BASE_URL` 与匹配的 `SUPPORT_SITE_TOKEN`；Vercel 的 Production/Preview/Development 需配置可达 HTTPS 隧道/服务地址及 token，不能填工作站 localhost。模型 key、知识路径、数据库和持久化由 Python 服务管理。`maxDuration=120`、上游超时 90 秒、不自动重试；平台函数时长限制需匹配。本批次未开通隧道或发布部署。
- **最近提交**：本次 `fix: 将 PC 首页页脚融入主体并取消纵向滚动`；上次 `493f8cf`（红黑动漫首页、视差与入场动画），已完成 Vercel 发布。
- **本批次改动**：首页按用户提供的红黑动漫设计重构，接入透明人物 PNG；新增 game-home.module.css，实现分层鼠标视差、GSAP 首访错峰入场、双语菜单、明暗主题与手机布局。globals.css 删除旧首页样式并添加首页专属透明 header。未新增依赖。此批次作为一个提交合并到 main，未保留其他未提交改动。
- **本批次验证**：TypeScript、首页 ESLint、diff 检查通过；浏览器验证中文/英文、浅色/深色、390px 手机及桌面布局、鼠标视差、导航与返回、刷新入场及 resize 往返一致性。`next build --webpack` 完整通过（38 个静态页面）。默认 Turbopack 生产构建遇到子进程连接异常；沙箱内另遇 Google 字体网络限制，未更改既有构建配置或字体来源。

## 维护约定（agent 必读）
- **任务完成或新增功能后，及时更新本文件**：架构/功能清单/注意事项/当前状态（含最近提交、未提交批次）要与代码同步。
- 本文件是后续任何 agent 理解项目的第一入口，保持准确比保持简短更重要；改动小到一行 CSS 也可不写，但**结构性变化、新组件/新页面/新依赖、踩坑经验、参数锁定**必须记录。
- 不要修改上方 `<!-- BEGIN:nextjs-agent-rules -->` 官方区块（由 next dev 维护）。