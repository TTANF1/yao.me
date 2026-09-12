/**
 * 语言切换 View Transition 的跨组件共享状态。
 *
 * App Router 在 [locale] 段变化时整棵子树重挂载，组件实例不保留；
 * 这里用 window 上的全局引用在"语言切换桥接（locale-switcher）"与
 * "洗牌动效（scramble-text）"之间传递"最近一次过渡"：
 * 洗牌等待该过渡结束后再开始，形成"内容滚入 → 文字洗牌落定"的级联节奏
 * （过渡播放期间真实 DOM 不绘制，若不同步会让洗牌被过渡快照盖住）。
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
