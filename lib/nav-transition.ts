/**
 * 文章/随记「列表 → 详情」与「详情 → 列表」的导航视图过渡。
 *
 * 参考 Chrome 跨文档视图过渡演示（view-transitions.chrome.dev/profiles/mpa）：
 * MPA 用 pageswap / pagereveal 在旧、新两个文档上动态设置 view-transition-name，
 * 让"被点击行"与"详情页标题"作为共享元素 morph，并用导航类型区分前进/返回方向。
 * App Router 是客户端导航（同文档），没有 pageswap/pagereveal，这里复刻同一套时序：
 *
 * 1. 点击（= pageswap）：先临时给被点击行的标题命名（detail-title）、剥离
 *    page-content 命名，再 document.startViewTransition 启动过渡——旧快照此刻拍摄；
 * 2. 新页提交（= pagereveal）：布局里的 NavTransitionBridge 在 pathname 变化时
 *    先补上新页需要参与过渡的命名（返回时给对应行标题补名、剥离 page-content），
 *    再兑现 commit——新快照在 React 提交、DOM 就位后才拍摄；
 * 3. 过渡结束（vt.finished）：清理临时命名与标志，为下一次导航 / 语言切换做准备。
 *
 * 与语言切换共用"导航提交"槽位（见 lib/view-transition.ts），同一时刻只允许一个过渡在途；
 * 引擎不支持 / 系统减弱动效 / 修饰键点击时退化为普通导航。
 */

import { useRouter } from 'next/navigation'
import {
  hasPendingNavigationCommit,
  registerNavigationCommit,
  resolveNavigationCommitIfPending,
} from '@/lib/view-transition'

export type NavKind = 'post' | 'note'
export type NavType = 'nav-forward' | 'nav-back'

type Router = ReturnType<typeof useRouter>

/** 内容块选择器：语言切换的 page-content 命名在导航期间被剥离，避免与 root 滑动冲突 */
const CONTENT_SELECTOR = '[data-vt-content]'

/** 详情页标题在视口中的预估顶部位置（header + article py-16 + mt-6 约 170px）：用于按位移距离自适应 morph 时长 */
export const DETAIL_TITLE_TARGET_TOP = 170

/** 过渡参与标题的临时类：禁掉 .list-title 的 hover 下划线（::after），避免下划线被渲染进过渡快照 */
export const VT_TITLE_CLASS = 'vt-transition-title'

/** 导航过渡结束事件：详情页 TOC 等组件据此延后显示（避免过渡动画未落定就出现） */
export const NAV_TRANSITION_END_EVENT = 'nav-transition-end'

/**
 * 标题共享元素的 view-transition-name。
 * 同一次导航只有一个标题配对（被点击行 ⇄ 详情页标题），固定名即可。
 */
export const DETAIL_TITLE_NAME = 'detail-title'

type PendingNav = { type: NavType; kind: NavKind; slug: string }

/** 在途导航信息：由新页面的 NavTransitionBridge 读取一次 */
let pendingNav: PendingNav | null = null

/** 导航过渡在途标志：新页面的 Reveal 据此跳过滚动入场（避免快照拍到 opacity: 0） */
let navTransitionInFlight = false

/** 代次：保证清理只作用于本次导航（防止快速连点时的串扰） */
let navSeq = 0

export function isNavTransitionInFlight() {
  return navTransitionInFlight
}

/** 读取并清空在途导航信息（仅由 NavTransitionBridge 在新页调用一次） */
export function consumePendingNav(): PendingNav | null {
  const nav = pendingNav
  pendingNav = null
  return nav
}

function stripPageContentNames() {
  document.querySelectorAll<HTMLElement>(CONTENT_SELECTOR).forEach((el) => {
    if (el.style.viewTransitionName === 'page-content') {
      el.style.viewTransitionName = ''
    }
  })
}

function restorePageContentNames() {
  document.querySelectorAll<HTMLElement>(CONTENT_SELECTOR).forEach((el) => {
    if (!el.style.viewTransitionName) {
      el.style.viewTransitionName = 'page-content'
    }
  })
}

/** 清除新页面上由桥接器补上的临时标题命名（过渡完成后调用） */
function clearDetailTitleNames() {
  document
    .querySelectorAll<HTMLElement>(`[data-vt-slug] .list-title`)
    .forEach((el) => {
      if (el.style.viewTransitionName === DETAIL_TITLE_NAME) {
        el.style.viewTransitionName = ''
        el.classList.remove(VT_TITLE_CLASS)
      }
    })
}

function canTransition(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 修饰键 / 已处理点击：放行默认导航，不启动过渡 */
export function isModifiedClick(e: {
  defaultPrevented: boolean
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}) {
  return (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  )
}

/**
 * 新页提交时调用（NavTransitionBridge）：补上新页需要参与过渡的命名。
 * 返回导航发生时再兑现 commit（由调用方顺序执行，保证补名先于快照拍摄）。
 */
export function applyPendingNavToNewPage() {
  const nav = consumePendingNav()
  if (!nav) return
  stripPageContentNames()
  if (nav.type === 'nav-back') {
    // 详情 → 列表：给被点击行的标题补临时命名，与详情页标题构成反向 morph 对
    const el = document.querySelector<HTMLElement>(
      `[data-vt-slug="${CSS.escape(nav.slug)}"] .list-title`,
    )
    if (el) {
      el.style.viewTransitionName = DETAIL_TITLE_NAME
      el.classList.add(VT_TITLE_CLASS)
    }
  }
}

/**
 * 启动一次列表 ⇄ 详情导航过渡。
 * prepOldPage 在旧快照拍摄前同步执行（设置被点击行标题的共享命名等）。
 * 引擎不支持 / 系统减弱动效 / 已有过渡在途时退化为普通 router.push。
 */
export function startNavTransition(
  router: Router,
  href: string,
  type: NavType,
  kind: NavKind,
  slug: string,
  prepOldPage: () => void,
) {
  if (!canTransition() || hasPendingNavigationCommit()) {
    router.push(href)
    return
  }

  prepOldPage()
  stripPageContentNames()

  const seq = ++navSeq
  const commit = new Promise<void>((resolve) => registerNavigationCommit(resolve))
  pendingNav = { type, kind, slug }
  navTransitionInFlight = true

  let vt: ViewTransition | null = null
  try {
    // Chrome 126+：带类型启动（CSS 用 :active-view-transition-type 区分方向）
    vt = document.startViewTransition({ types: [type], update: () => commit })
  } catch {
    // 旧版 Chrome：退化为无类型过渡（沿用语言切换的上下滚动动效，不报错）
    try {
      vt = document.startViewTransition(() => commit)
    } catch {
      if (seq === navSeq) {
        pendingNav = null
        navTransitionInFlight = false
        resolveNavigationCommitIfPending()
      }
      router.push(href)
      return
    }
  }

  router.push(href)

  // 兜底：导航未提交（异常/失败）时释放等待，避免过渡永久悬挂
  setTimeout(() => {
    if (seq === navSeq) resolveNavigationCommitIfPending()
  }, 3000)

  // 过渡被跳过/中止时 ready 会拒绝：导航已由 router.push 完成，静默吞掉即可
  // （否则产生未捕获的 InvalidStateError 控制台报错）
  vt.ready.catch(() => {})

  const cleanup = () => {
    if (seq !== navSeq) return
    restorePageContentNames()
    clearDetailTitleNames()
    navTransitionInFlight = false
    pendingNav = null
    document.documentElement.style.removeProperty('--vt-morph-duration')
    // 通知详情页 TOC 等组件：过渡已落定，可以恢复即时显示
    window.dispatchEvent(new Event(NAV_TRANSITION_END_EVENT))
  }
  vt.finished.then(cleanup, cleanup)
}
