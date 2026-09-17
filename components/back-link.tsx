'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * 详情页返回列表链接：普通客户端导航（不启动视图过渡）。
 * 返回按钮位于长文底部，与标题 morph 的目标位置差异大，过渡效果定位差，
 * 因此返回不做视图过渡，直接回到列表。
 */
export function BackLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}