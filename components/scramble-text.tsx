'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ElementType } from 'react'
import { getLastViewTransition } from '@/lib/view-transition'

/**
 * 语言切换的文字洗牌动效（B 方案）：
 * text prop 变化时，字符先以符号字库（@ & $ …）快速乱序闪动，再逐字落定为目标文字，
 * 营造"文字在选择"的过渡观感。
 *
 * 关键机制：
 * - App Router 在 [locale] 段变化时会重挂载整棵子树（layout 的 header、页面内容都会重建），
 *   组件实例不保留 state；但浏览器 JS 上下文跨客户端导航存活，因此用模块级 Map 记住每个
 *   id 上次落定的文字，重挂载后仍能还原"旧文字"并触发洗牌（id 必须全局稳定）。
 * - displayRef 兜底"实例保留、prop 变化"的场景（同 locale 内的原地文本更新）。
 * - 结束态严格落定为目标文字，不残留任何透明/位移/中间状态——规避演示实例中
 *   fill:forwards 残留 opacity:0 导致"切换后文字消失"的问题。
 * - 短文本（≤4 字符，如 nav 的"首页"）若沿用"逐字推进"会在第 2 帧就全部落定，
 *   几乎看不出洗牌，因此单独拉长节奏：更多乱码帧 + 更慢的步进，营造"狂闪后定格"。
 * - 尊重 prefers-reduced-motion：直接切换，不洗牌。
 */
const SCRAMBLE_POOL = '@&$#%*+!?~§£€¥<>^_'
/** 短文本阈值：字符数小于等于该值时启用"拉长版"洗牌节奏 */
const SHORT_TEXT_LIMIT = 4
const lastTexts = new Map<string, string>()

export function ScrambleText({
  text,
  id,
  as: Tag = 'span',
  className,
}: {
  text: string
  /** 全局稳定标识：用于跨重挂载还原上次文字，同一位置必须保持不变 */
  id: string
  as?: ElementType
  className?: string
}) {
  const [display, setDisplay] = useState(text)
  const displayRef = useRef(text)
  const timerRef = useRef<number | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const prev = lastTexts.get(id)
    const animate = displayRef.current !== text || (prev !== undefined && prev !== text)

    if (!animate) {
      lastTexts.set(id, text)
      return
    }
    if (reduce) {
      displayRef.current = text
      lastTexts.set(id, text)
      // 微任务内更新：同帧生效（不产生可见旧帧），同时符合 react-hooks 规范
      queueMicrotask(() => setDisplay(text))
      return
    }

    let cancelled = false
    const startScramble = () => {
      if (cancelled) return
      if (timerRef.current !== null) window.clearInterval(timerRef.current)

      // 节奏：短文本拉长（字符少、单帧变化量小，需要更多乱码帧才看得出"洗牌"）
      const short = text.length <= SHORT_TEXT_LIMIT
      const stepMs = short ? 46 : 34
      const totalSteps = short
        ? 12
        : Math.max(10, Math.ceil(Math.min(560, 260 + text.length * 16) / stepMs))
      let step = 0

      timerRef.current = window.setInterval(() => {
        step++
        // 前段全乱码，最后 len 步逐字落定：
        // 短文本因此有足够的"选择"阶段（狂闪后定格），长文本保持渐进揭晓
        const fixed = Math.max(0, text.length - Math.max(0, totalSteps - step))
        let out = ''
        for (let i = 0; i < text.length; i++) {
          out +=
            i < fixed
              ? text[i]
              : SCRAMBLE_POOL[(Math.random() * SCRAMBLE_POOL.length) | 0]
        }
        displayRef.current = out
        setDisplay(out)

        if (step >= totalSteps) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current)
          timerRef.current = null
          displayRef.current = text
          lastTexts.set(id, text)
          setDisplay(text)
        }
      }, stepMs)
    }

    // 语言切换经 View Transition（A 方案）时，等过渡结束再洗牌，
    // 避免洗牌被过渡快照盖住；直接导航/首页瞬时过渡则立即开始
    const vt = getLastViewTransition()
    if (vt?.finished) {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 900))
      Promise.race([vt.finished.then(() => {}, () => {}), timeout]).then(
        startScramble,
      )
    } else {
      startScramble()
    }

    return () => {
      cancelled = true
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [id, text, reduce])

  return <Tag className={className}>{display}</Tag>
}
