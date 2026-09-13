'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ScrambleText } from './scramble-text'

export interface NavItem {
  key: string
  href: string
  label: string
}

/**
 * 主导航：
 * - 移动端内容溢出时横向滚动（隐藏滚动条），左右尽头渐隐遮罩
 * - 桌面端（sm 及以上）正常展示，无溢出则遮罩自动隐藏
 */
export function NavBar({ items }: { items: NavItem[] }) {
  const scroller = useRef<HTMLElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () => {
      const tolerance = 2
      setAtStart(el.scrollLeft <= tolerance)
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="relative min-w-0 flex-1 sm:flex-none">
      <nav
        ref={scroller}
        aria-label="Main"
        className="no-scrollbar flex items-center gap-3 overflow-x-auto text-base sm:gap-5"
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="link shrink-0 whitespace-nowrap"
          >
            {/* 语言切换时导航文字做洗牌动效（B 方案，header 固定使用） */}
            <ScrambleText id={`nav-${item.key}`} text={item.label} />
          </Link>
        ))}
      </nav>
      {/* 左端渐隐遮罩：滚到起点隐藏 */}
      <div
        aria-hidden
        className={`nav-fade-left pointer-events-none absolute inset-y-0 -left-px w-8 transition-opacity duration-200 ${
          atStart ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* 右端渐隐遮罩：滚到终点隐藏 */}
      <div
        aria-hidden
        className={`nav-fade-right pointer-events-none absolute inset-y-0 -right-px w-8 transition-opacity duration-200 ${
          atEnd ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  )
}
