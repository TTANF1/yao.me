'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/lib/locale'
import {
  hasPendingNavigationCommit,
  registerNavigationCommit,
  resolveNavigationCommitIfPending,
  setLastViewTransition,
} from '@/lib/view-transition'

/**
 * 语言切换桥接：
 * App Router 在 [locale] 段变化时会整体重挂载 [locale] 子树（header / 本组件实例都会重建），
 * 组件实例 state 不保留，但模块级变量随浏览器 JS 上下文跨客户端导航存活——
 * 导航提交（pathname 变化）时由 NavTransitionBridge 统一兑现等待中的 commit，
 * 让 View Transition 在正确时机捕获新页面快照（本组件不再自行兑现）。
 */

export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale
  label: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const other: Locale = current === 'zh' ? 'en' : 'zh'
  const rest = pathname.replace(/^\/(zh|en)/, '')
  const href = `/${other}${rest}`

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000; samesite=lax`

    // 引擎不支持或用户偏好减弱动效 → 走默认导航
    const canTransition =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canTransition) return

    // 已有过渡在途（快速连点 / 详情导航）：直接导航，避免旧过渡因 Promise 被覆盖而悬挂
    if (hasPendingNavigationCommit()) {
      router.push(href)
      return
    }

    e.preventDefault()

    const commit = new Promise<void>((resolve) => registerNavigationCommit(resolve))
    let vt
    try {
      // 更新回调返回 Promise：浏览器会等到导航提交（新页面渲染完成）再捕获新快照
      vt = document.startViewTransition(() => commit)
    } catch {
      // 引擎异常（如标签页不可见时 API 直接抛错）：放行默认导航
      router.push(href)
      return
    }
    // 供洗牌动效等待过渡结束，形成"滚入 → 洗牌落定"的级联
    setLastViewTransition(vt)
    // 过渡被跳过/中止时 finished 会拒绝：静默吞掉，避免未捕获的 InvalidStateError
    vt.finished.catch(() => {})
    router.push(href)

    // 兜底：若导航未提交（异常/失败），3s 后释放等待，避免过渡永久悬挂
    setTimeout(() => resolveNavigationCommitIfPending(), 3000)
  }

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={handleClick}
      className="inline-flex h-8 items-center rounded-md px-2 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {other === 'zh' ? '中文' : 'EN'}
    </Link>
  )
}
