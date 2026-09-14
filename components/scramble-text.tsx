'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ElementType } from 'react'

/**
 * 语言切换的文字洗牌动效（B 方案）：
 * text prop 变化时，字符先以符号字库（@ & $ …）快速乱序闪动，再逐字落定为目标文字，
 * 营造"文字在选择"的过渡观感。
 *
 * 关键机制：
 * - App Router 在 [locale] 段变化时会重挂载整棵子树（layout 的 header、页面内容都会重建），
 *   组件实例不保留 state；但浏览器 JS 上下文跨客户端导航存活，因此用模块级 Map 记住每个
 *   id 上次落定的文字，重挂载后仍能判断"这是语言切换"并触发洗牌（id 必须全局稳定）。
 * - 洗牌与 ViewTransition 过渡「同步」播放：语言切换场景下新页面首帧直接渲染乱码
 *   （而不是旧文字或新文字），过渡动画从旧快照平滑转入乱码帧，过渡完成后文字继续洗牌落定；
 *   避免"过渡结束后新文案/旧文案先亮相、再补播洗牌"的错位。
 * - 同 locale 内的原地文本更新（displayRef 场景）：实例保留、prop 变化，同样触发洗牌。
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

/** 生成一帧全乱码（长度与目标文字一致，避免布局跳动） */
function randomScramble(length: number) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += SCRAMBLE_POOL[(Math.random() * SCRAMBLE_POOL.length) | 0]
  }
  return out
}

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
  const [display, setDisplay] = useState(() => {
    // 语言切换场景（上次落定文字存在且与新文字不同）：首帧直接乱码，
    // 洗牌与 ViewTransition 过渡同步播放；其余场景（首访/同文字）直接显示目标文字
    const prev = lastTexts.get(id)
    return prev !== undefined && prev !== text ? randomScramble(text.length) : text
  })
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

    // 洗牌立即开始（首帧已是乱码），与 ViewTransition 动画同步播放；
    // 不再等待过渡结束，避免"新/旧文案先亮相、再补播洗牌"的错位
    startScramble()

    return () => {
      cancelled = true
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [id, text, reduce])

  return <Tag className={className}>{display}</Tag>
}
