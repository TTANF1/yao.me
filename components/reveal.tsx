'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { isNavTransitionInFlight } from '@/lib/nav-transition'

/**
 * 滚动入场动画：位移 24px + 淡入，0.9s 柔和缓动（easeOutCubic，不紧不慢的出场）。
 * - 尊重 prefers-reduced-motion（系统减弱动效时直接静态渲染）
 * - 只用于次级区块，首屏 hero 不做动画，保证核心内容始终可读
 * - 浏览器前进/后退（popstate 历史导航）进入页面时不重放入场动画（内容已看过）
 * - 动画播放期间容器不可交互（pointer-events: none）：等入场结束才能点击内部链接
 */

/** 历史导航（浏览器前进/后退）后的短窗口：窗口内挂载的 Reveal 跳过入场，避免"回退又播一遍" */
const POP_NAV_WINDOW_MS = 1500
let popNav = false
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    popNav = true
    // 短窗口后自动复位，之后的正常导航照常播放入场
    setTimeout(() => {
      popNav = false
    }, POP_NAV_WINDOW_MS)
  })
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  // mount 时快照：popstate 窗口内进入（浏览器回退/前进）则跳过入场
  const [skipEntrance] = useState(popNav)
  // 入场动画完成前容器不可点击（列表/卡片链接需等入场落定）
  const [settled, setSettled] = useState(false)

  // 兜底：动画因 IntersectionObserver 未触发 / 动画中断等原因未完成时，超时后强制放行点击
  // （0.9s 动画 + delay + 余量；正常完成时 onAnimationComplete 已先行置位，重复无害）
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 1200 + delay * 1000)
    return () => clearTimeout(t)
  }, [delay])

  if (reduce || isNavTransitionInFlight() || skipEntrance) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: [0.33, 1, 0.68, 1] }}
      onAnimationComplete={() => setSettled(true)}
      style={{ pointerEvents: settled ? 'auto' : 'none' }}
    >
      {children}
    </motion.div>
  )
}
