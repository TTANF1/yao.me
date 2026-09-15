'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 文章详情页 header 收起/展开（仅限 /blog/[slug] 与 /notes/[slug]）：
 * - 向下滚动 → header 向上收起（translateY(-100%)）
 * - 向上滚动 或 回到页面顶部附近 → header 重新展示
 * - 其他页面不生效，header 保持常驻
 */
const DETAIL_PATTERN = /^\/(zh|en)\/(blog|notes)\/[^/]+$/

export function ScrollHeader() {
  const pathname = usePathname()

  useEffect(() => {
    if (!DETAIL_PATTERN.test(pathname)) return
    const header = document.querySelector<HTMLElement>('header[data-site-header]')
    if (!header) return

    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      // 回到顶部附近（< 96px）总是展示
      if (y < 96) {
        header.style.transform = ''
        return
      }
      if (delta > 0) {
        // 向下滚动：收起
        header.style.transform = 'translateY(-100%)'
      } else if (delta < 0) {
        // 向上滚动：展开
        header.style.transform = ''
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      header.style.transform = ''
    }
  }, [pathname])

  return null
}
