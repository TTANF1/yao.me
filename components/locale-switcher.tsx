'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Locale } from '@/lib/locale'
import { setLastViewTransition } from '@/lib/view-transition'

/**
 * 模块级"导航已提交"信号：
 * App Router 在 [locale] 段变化时会整体重挂载 [locale] 子树（header / 本组件实例都会重建），
 * 组件实例 state 不保留，但模块级变量随浏览器 JS 上下文跨客户端导航存活——
 * 因此由新挂载的实例在 pathname 变化（导航提交）时兑现旧实例留下的 Promise，
 * 让 View Transition 在正确时机捕获新页面快照。
 */
let resolveNavigationCommit: (() => void) | null = null

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

  // 导航提交（pathname 变化）时，兑现等待中的 View Transition 更新回调
  useEffect(() => {
    if (resolveNavigationCommit) {
      const resolve = resolveNavigationCommit
      resolveNavigationCommit = null
      resolve()
    }
  }, [pathname])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000; samesite=lax`

    // 引擎不支持或用户偏好减弱动效 → 走默认导航
    const canTransition =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canTransition) return

    // 已有过渡在途（快速连点）：直接导航，避免旧过渡因 Promise 被覆盖而悬挂
    if (resolveNavigationCommit) {
      router.push(href)
      return
    }

    e.preventDefault()

    const commit = new Promise<void>((resolve) => {
      resolveNavigationCommit = resolve
    })
    // 更新回调返回 Promise：浏览器会等到导航提交（新页面渲染完成）再捕获新快照
    const vt = document.startViewTransition(() => commit)
    // 供洗牌动效等待过渡结束，形成"滚入 → 洗牌落定"的级联
    setLastViewTransition(vt)
    router.push(href)

    // 兜底：若导航未提交（异常/失败），3s 后释放等待，避免过渡永久悬挂
    setTimeout(() => {
      if (resolveNavigationCommit) {
        const resolve = resolveNavigationCommit
        resolveNavigationCommit = null
        resolve()
      }
    }, 3000)
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
