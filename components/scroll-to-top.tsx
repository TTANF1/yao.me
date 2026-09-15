'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUpIcon } from '@/components/icons'

/**
 * 文章详情页右下角"回顶部"按钮：
 * - 仅限 /blog/[slug] 与 /notes/[slug] 显示
 * - 向下滚动超过阈值后渐显，回到顶部附近自动渐隐
 * - 点击平滑滚动回页面顶部
 */
const DETAIL_PATTERN = /^\/(zh|en)\/(blog|notes)\/[^/]+$/
const SHOW_AFTER = 480

export function ScrollToTop() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(DETAIL_PATTERN.test(pathname) && window.scrollY > SHOW_AFTER)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // 挂载/路由变化后立即校准一次（异步，避免 effect 内同步 setState）
    const raf = requestAnimationFrame(onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-background/85 text-muted shadow-sm backdrop-blur transition-opacity duration-300 hover:text-foreground ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  )
}
