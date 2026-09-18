'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState, type CSSProperties, type ElementType } from 'react'

gsap.registerPlugin(useGSAP)

/**
 * 首页 hero 打字机（GSAP）：
 * - 逐行依次打字输出，当前行末尾跟随一个闪烁光标，全部打完光标停在最后一行继续闪烁
 * - SSR / 首帧渲染完整文本（无 JS 也可读 + SEO），useGSAP 在浏览器绘制前（useLayoutEffect
 *   时机）清空文本并从零打字，用户看不到"全文闪现"
 * - 语言切换（[locale] 段变化整棵子树重挂载）时重新打出新文案；
 *   浏览器前进/后退进入首页（popstate 窗口内）跳过打字，内容已看过
 * - 尊重 prefers-reduced-motion：直接显示全文，不打字
 * - 踩坑记录：
 *   ① 无限 repeat 的光标闪烁 tween 不能放进打字 timeline（duration 被撑成 Infinity，
 *      整条时间线停在 0 秒不推进），必须在 timeline 完成回调里单独启动
 *   ② 不要用 useReducedMotion() 作为 useGSAP 依赖：hydration 后它从 null 变为 false 会
 *      触发 useGSAP 重跑，与旧 timeline 并存互相清空文本；改为回调内同步 matchMedia 读取
 *   ③ 不要在 useGSAP 回调里再嵌套 gsap.context()：useGSAP 自带 context（scope），嵌套的
 *      context 不在它的清理范围内，unmount/revert 时旧动画残留
 */

/** 历史导航（浏览器前进/后退）后的短窗口：窗口内挂载跳过打字（内容已看过） */
const POP_NAV_WINDOW_MS = 1500
let popNav = false
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    popNav = true
    // 短窗口后自动复位，之后的正常导航照常打字
    setTimeout(() => {
      popNav = false
    }, POP_NAV_WINDOW_MS)
  })
}

export interface TypeLine {
  text: string
  /** 渲染标签：p / h1 等，默认 p */
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** 首行淡入（不打字，问候语直接出现） */
  fadeIn?: boolean
  /** 每字符耗时（秒），默认 0.09 */
  cps?: number
}

export function HeroTypewriter({ lines }: { lines: TypeLine[] }) {
  const root = useRef<HTMLDivElement>(null)
  // mount 时快照：popstate 窗口内进入（浏览器回退/前进）则跳过打字
  const [skipEntrance] = useState(popNav)

  // 空依赖：只跑一次（React StrictMode 开发态会双跑，第二次覆盖第一次，最终正常）
  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return
      // 同步读取 reduced-motion，避免用 useReducedMotion 的 null→false 变化触发重跑
      const prefersReduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduce || skipEntrance) return // 首帧已是完整文本，直接静态展示

      const textEls = gsap.utils.toArray<HTMLElement>(
        '[data-type-text]',
        root.current,
      )
      const cursorEls = gsap.utils.toArray<HTMLElement>(
        '[data-type-cursor]',
        root.current,
      )

      // 浏览器绘制前清空全部文本与光标，从零开始打字
      textEls.forEach((el) => (el.textContent = ''))
      gsap.set(cursorEls, { opacity: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'none' } })
      let lastCursor: HTMLElement | null = null

      lines.forEach((line, i) => {
        const textEl = textEls[i]
        const cursorEl = cursorEls[i]
        if (!textEl) return
        const full = line.text

        // 问候语：直接淡入（不打字）——恢复被清空的文本后淡入
        if (line.fadeIn) {
          textEl.textContent = full
          tl.fromTo(
            textEl,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
            0,
          )
          return
        }

        // 打字行：先亮光标，再逐字输出（用 proxy 数值驱动 textContent，避免每帧 setState）
        tl.set(cursorEl, { opacity: 1 })
        const proxy = { n: 0 }
        tl.to(
          proxy,
          {
            n: full.length,
            duration: Math.max(0.25, full.length * (line.cps ?? 0.09)),
            ease: 'none',
            onUpdate: () => {
              textEl.textContent = full.slice(0, Math.round(proxy.n))
            },
          },
          '<',
        )

        // 非最后一行：打完后光标熄灭，交给下一行
        if (i < lines.length - 1 && cursorEl) {
          tl.set(cursorEl, { opacity: 0 })
        } else {
          lastCursor = cursorEl
        }
      })

      // 最后一行打完：光标常驻，并启动独立的无限闪烁 tween（不能放进 timeline，见踩坑①）
      if (lastCursor) {
        tl.set(lastCursor, { opacity: 1 })
        tl.eventCallback(
          'onComplete',
          contextSafe(() => {
            gsap.to(lastCursor, {
              opacity: 0,
              duration: 0.5,
              repeat: -1,
              yoyo: true,
              ease: 'steps(1)',
            })
          }),
        )
      }
    },
    { scope: root },
  )

  return (
    <div ref={root}>
      {lines.map((line, i) => {
        const Tag = line.as ?? 'p'
        return (
          <Tag key={i} className={line.className} style={line.style}>
            <span data-type-text>{line.text}</span>
            <span data-type-cursor aria-hidden className="type-cursor" />
          </Tag>
        )
      })}
    </div>
  )
}
