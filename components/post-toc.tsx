'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Locale } from '@/lib/locale'
import { ScrollToTop } from '@/components/scroll-to-top'

interface TocItem {
  id: string
  text: string
  level: number
}

/**
 * 文章页左侧目录：
 * - 从正文 DOM 提取 h2 / h3（id 由 rehype-slug 生成），构建两级目录
 * - 目录固定在视口左侧（header 下方），滚动文章时始终可见，不再受文章容器高度限制
 * - 鼠标进入文章详情区域时目录渐显，移出时渐隐（平时透明且不拦截交互）
 * - 点击目录项平滑滚动到对应标题（scrollIntoView smooth）
 * - 仅 md 及以上视口显示，移动端隐藏
 */
export default function PostToc({
  children,
  locale,
}: {
  children: ReactNode
  locale: Locale
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<TocItem[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3'))
      .filter((h) => h.id)
      .map((h) => ({
        id: h.id,
        text: h.textContent?.trim() ?? '',
        level: h.tagName === 'H3' ? 3 : 2,
      }))
    setItems(headings)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const label = locale === 'zh' ? '目录' : 'Contents'

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* 目录：fixed 固定在 header 下方，滚动文章时始终跟随视口；hover 渐显渐隐。
          随记等没有章节标题的文章不渲染目录（空目录无意义）。 */}
      {items.length > 0 && (
        <aside
          aria-hidden={!visible}
          className={`fixed z-10 hidden transition-opacity duration-300 md:block ${
            visible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{
            top: 'max(5.5rem, 88px)',
            // 正文 max-w-2xl 居中后，目录落在正文左侧空白区（窄视口下退到页边距）
            left: 'max(1.5rem, calc(50vw - 37rem))',
            width: '230px',
          }}
        >
          <nav aria-label={label}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
            <ul className="mt-3 space-y-1 border-l border-line pl-3.5 text-[13px] leading-snug">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo(item.id)
                    }}
                    className={`block py-0.5 text-muted transition-colors duration-200 hover:text-foreground ${
                      item.level === 3 ? 'pl-3' : ''
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      {/* 内容布局：正文本身居中，目录以 fixed 浮动层形式悬浮在左侧，不挤占正文位置 */}
      <div ref={contentRef} className="mx-auto w-full max-w-2xl">
        {children}
      </div>

      {/* 文章详情页右下角回顶按钮（fixed 定位，不占布局） */}
      <ScrollToTop />
    </div>
  )
}
