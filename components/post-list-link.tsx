'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  DETAIL_TITLE_NAME,
  DETAIL_TITLE_TARGET_TOP,
  VT_TITLE_CLASS,
  isModifiedClick,
  startNavTransition,
  type NavKind,
} from '@/lib/nav-transition'

/**
 * 文章/随记列表项链接：点击时以"导航视图过渡"进入详情页。
 * - 给被点击行的标题临时命名（detail-title），与详情页标题构成共享元素 morph
 * - 方向 nav-forward：旧内容左滑淡出、新内容右滑淡入（见 globals.css）
 * 修饰键点击 / 引擎不支持 / 减弱动效时退化为普通导航。
 */
export function PostListLink({
  href,
  kind,
  slug,
  className,
  children,
}: {
  href: string
  kind: NavKind
  slug: string
  className?: string
  children: ReactNode
}) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(e)) return
    startNavTransition(router, href, 'nav-forward', kind, slug, () => {
      // 旧快照拍摄前：给被点击行的标题临时命名（返回时由桥接器补到新页对应行），
      // 并临时禁掉 hover 下划线（避免 ::after 被渲染进快照）；同时按位移距离
      // 自适应 morph 时长：距离越远动画越慢，避免高速位移的观感掉帧
      const title = e.currentTarget.querySelector<HTMLElement>('.list-title')
      if (title) {
        title.style.viewTransitionName = DETAIL_TITLE_NAME
        title.classList.add(VT_TITLE_CLASS)
        const dist = Math.abs(title.getBoundingClientRect().top - DETAIL_TITLE_TARGET_TOP)
        const duration = Math.round(Math.min(560, Math.max(240, 160 + dist * 0.8)))
        document.documentElement.style.setProperty('--vt-morph-duration', `${duration}ms`)
      }
    })
    e.preventDefault()
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      data-vt-slug={slug}
    >
      {children}
    </Link>
  )
}
