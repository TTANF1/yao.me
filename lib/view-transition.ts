/**
 * 语言切换与详情导航 View Transition 的跨组件共享状态。
 *
 * App Router 在 [locale] 段变化时整棵子树重挂载，组件实例不保留；
 * 这里用 window 上的全局引用 + 模块级"导航提交"槽位，在同一套机制下传递：
 * - 语言切换桥接（locale-switcher）→ 洗牌动效（scramble-text）：最近一次过渡
 * - 手动 startViewTransition 的 commit 兑现：新页面在 pathname 变化时由
 *   NavTransitionBridge 统一兑现，让浏览器在 React 提交、DOM 就位后才拍摄新快照
 *   （语言切换与详情导航共用同一槽位：同一时刻只允许一个过渡在途，避免互相打断）。
 */

interface ViewTransitionLike {
  finished?: Promise<unknown>
}

declare global {
  interface Window {
    __lastViewTransition?: ViewTransitionLike
  }
}

export function setLastViewTransition(vt: ViewTransitionLike | undefined) {
  if (typeof window === 'undefined') return
  window.__lastViewTransition = vt
}

/** 返回最近一次语言切换过渡；无过渡（如直接 URL 访问）时返回 null */
export function getLastViewTransition(): ViewTransitionLike | null {
  if (typeof window === 'undefined') return null
  return window.__lastViewTransition ?? null
}

/* ============================================================
   导航提交槽位（语言切换 / 详情导航共用）
   ============================================================ */

/**
 * 等待中的导航提交兑现函数（模块级：跨客户端导航存活）。
 * 由 locale-switcher / nav-transition 在启动过渡时登记；
 * 新页面 DOM 就位后由 NavTransitionBridge 统一兑现（幂等）。
 */
let resolveNavigationCommit: (() => void) | null = null

/** 是否有过渡在途（快速连点守卫：有则跳过过渡直接导航） */
export function hasPendingNavigationCommit(): boolean {
  return resolveNavigationCommit !== null
}

/** 登记一次等待导航提交兑现的过渡 */
export function registerNavigationCommit(resolve: () => void) {
  resolveNavigationCommit = resolve
}

/** 兑现等待中的导航提交（幂等；由 NavTransitionBridge 在 pathname 变化时调用） */
export function resolveNavigationCommitIfPending() {
  if (resolveNavigationCommit) {
    const resolve = resolveNavigationCommit
    resolveNavigationCommit = null
    resolve()
  }
}
