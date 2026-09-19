'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ScrambleText } from './scramble-text'

gsap.registerPlugin(useGSAP)

export interface NavItem {
  key: string
  href: string
  label: string
}

/**
 * 主导航（GSAP 卡片化）：
 * - 每个 tab 是一张错落倾斜的小卡片（确定性姿态表，避免随机导致每次渲染抖动）
 * - 当前路由的卡片"伸出"（摆正放大、不透明、z 提升），其余"收起"（缩小、半透明、错落摆放）
 * - hover 任意卡片时 GSAP 平滑摆正放大展示；移出后回到各自姿态
 * - 卡片放大时内部文字按 1/cardScale 反补偿，card×label 合成缩放恒为 1（1:1 原生渲染，像素字体全程不插值、始终清晰）
 * - 移动端内容溢出时横向滚动（隐藏滚动条），左右尽头渐隐遮罩
 * - 语言切换文字洗牌（ScrambleText）保留
 */

/** 卡片"不规则摆列"姿态表：倾斜角度 + 纵向偏移，按序循环（5 项与 5 个 tab 一一对应） */
const POSES = [
  { rotation: -4, y: -2 },
  { rotation: 3, y: 3 },
  { rotation: -2, y: 1 },
  { rotation: 5, y: -3 },
  { rotation: -3, y: 4 },
]
/** 收起（非当前路由）姿态 */
const REST = { scale: 0.85, opacity: 0.72 }
/** 伸出（当前路由）姿态：明显放大，视觉上遮盖两侧相邻卡片 */
const ACTIVE = { scale: 1.32, opacity: 1, z: 4 }
/** hover 展示姿态（任意卡片摆正放大） */
const HOVER = { scale: 1.28, opacity: 1, z: 5 }
/** 文字反补偿：label scale = 1/cardScale，使 card × label 的合成缩放恒为 1（1:1 原生渲染）。
    像素字体对非整数倍 transform 缩放会插值发糊；组合恒 1 时文字全程清晰（视觉字号恒 16px，
    即"限制最大字号"的上限），卡片放大只放大面积。禁止改为 20/16/cardScale 之类的比例——
    静止组合会变成非整数倍（如 1.25），静止后文字立刻变糊（已踩坑）。 */
const labelScaleFor = (cardScale: number) => 1 / cardScale

export function NavBar({ items }: { items: NavItem[] }) {
  const scroller = useRef<HTMLElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const reduce = useReducedMotion()
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

  // 首页 href（`/${locale}`）只匹配完全相等，避免把 /zh/blog 误判为首页
  const homeHref = items[0]?.href ?? `/${pathname.split('/')[1] ?? 'zh'}`
  const isActive = (href: string) =>
    href === homeHref
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  // 路由变化（dependencies: pathname）时重设姿态；语言切换整棵子树重挂载，items 变化由新实例覆盖
  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return
      const cards = gsap.utils.toArray<HTMLElement>('[data-nav-card]', root.current)
      const cleanups: Array<() => void> = []

      cards.forEach((card, i) => {
        const pose = POSES[i % POSES.length]
        const active = card.dataset.active === 'true'
        const label = card.querySelector<HTMLElement>('[data-nav-label]')
        const duration = reduce ? 0 : 0.45
        const labelScale = (cardScale: number) => labelScaleFor(cardScale)
        /** 统一设置卡片姿态并同步 label 反补偿（hover 缩放后 leave 时一并恢复） */
        const setPose = (
          t: { rotation: number; y: number; scale: number; opacity: number; zIndex: number },
          dur: number,
          ease: string,
          overwrite?: boolean,
        ) => {
          gsap.to(card, { ...t, duration: dur, ease, overwrite })
          if (label) {
            gsap.to(label, { scale: labelScale(t.scale), duration: dur, ease, overwrite })
          }
        }

        // 初始姿态：当前路由伸出摆正，其余按姿态表收起错落
        setPose(
          {
            rotation: active ? 0 : pose.rotation,
            y: active ? 0 : pose.y,
            scale: active ? ACTIVE.scale : REST.scale,
            opacity: active ? ACTIVE.opacity : REST.opacity,
            zIndex: active ? ACTIVE.z : 1,
          },
          duration,
          'power2.out',
        )

        const onEnter = contextSafe(() => {
          setPose(
            {
              rotation: 0,
              y: 0,
              scale: HOVER.scale,
              opacity: HOVER.opacity,
              zIndex: HOVER.z,
            },
            reduce ? 0 : 0.32,
            'back.out(1.6)',
            true,
          )
        })
        const onLeave = contextSafe(() => {
          setPose(
            {
              rotation: active ? 0 : pose.rotation,
              y: active ? 0 : pose.y,
              scale: active ? ACTIVE.scale : REST.scale,
              opacity: active ? ACTIVE.opacity : REST.opacity,
              zIndex: active ? ACTIVE.z : 1,
            },
            reduce ? 0 : 0.35,
            'power2.out',
            true,
          )
        })

        card.addEventListener('mouseenter', onEnter)
        card.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          card.removeEventListener('mouseenter', onEnter)
          card.removeEventListener('mouseleave', onLeave)
        })
      })

      return () => cleanups.forEach((fn) => fn())
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  )

  return (
    <div ref={root} className="relative min-w-0 flex-1 sm:flex-none">
      <nav
        ref={scroller}
        aria-label="Main"
        className="no-scrollbar flex items-center gap-1 overflow-x-auto px-6 pt-6 pb-6 sm:gap-6 sm:px-6"
      >
        {items.map((item, i) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              data-nav-card
              data-active={active}
              data-index={i}
              aria-current={active ? 'page' : undefined}
              className="nav-card link shrink-0 whitespace-nowrap"
            >
              {/* 文字反补偿层：卡片放大时此层反向缩放，限制视觉字号（像素字体整数倍上限，防发糊） */}
              <span data-nav-label className="inline-block">
                <ScrambleText id={`nav-${item.key}`} text={item.label} />
              </span>
            </Link>
          )
        })}
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
