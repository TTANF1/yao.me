'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { resolveNavigationCommitIfPending } from '@/lib/view-transition'
import { applyPendingNavToNewPage } from '@/lib/nav-transition'

/**
 * 导航提交桥接器（挂在 [locale] layout）：
 * 手动 startViewTransition 的 update 回调等待"新页面提交"后才拍摄新快照；
 * 本组件在 pathname 变化（React 提交、新页 DOM 就位）时，先补上新页需要参与
 * 过渡的命名（返回时给对应行标题补名、剥离 page-content），再兑现 commit。
 * 语言切换与详情导航的 commit 都由此统一兑现（幂等）。
 */
export function NavTransitionBridge() {
  const pathname = usePathname()

  useEffect(() => {
    applyPendingNavToNewPage()
    resolveNavigationCommitIfPending()
  }, [pathname])

  return null
}
