'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * 滚动入场动画：位移 24px + 淡入，0.9s 柔和缓动（easeOutCubic，不紧不慢的出场）。
 * - 尊重 prefers-reduced-motion（系统减弱动效时直接静态渲染）
 * - 只用于次级区块，首屏 hero 不做动画，保证核心内容始终可读
 */
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
  if (reduce) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  )
}
