'use client'

import { useReducedMotion } from 'motion/react'
import { useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { MoonIcon, SunIcon } from './icons'
import { useTheme } from './theme-provider'

/** 客户端挂载检测：SSR 返回 false，hydration 后返回 true（不触发 setState-in-effect） */
const emptySubscribe = () => () => {}
const isClient = () => true
const isServer = () => false

/**
 * 主题切换交互动效参数（可调节）——弹簧/橡皮筋模型：
 * - baseDiameter   基准圆直径（px）
 * - overshootRatio 惯性溢出量（相对基准直径，0.4 = 越过基准 40%）
 * - recoilTarget   回弹落点（0.97 = 回落到基准直径的 97%）
 * - durations      四段时长：pop 加速弹出 / overshoot 减速溢出 / recoil 惯性回缩 / expand 加速扩散全屏
 * - eases          四段缓动：加速 / 减速 / 减速（柔）/ 加速（cubic-bezier）
 */
export const THEME_TRANSITION = {
  baseDiameter: 150,
  overshootRatio: 0.4,
  recoilTarget: 0.97,
  durations: { pop: 0.14, overshoot: 0.18, recoil: 0.33, expand: 0.45 },
  eases: {
    pop: 'cubic-bezier(0.5, 0, 0.75, 0.4)',
    overshoot: 'cubic-bezier(0.2, 0.1, 0.3, 1)',
    recoil: 'cubic-bezier(0.3, 0.05, 0.2, 1)',
    expand: 'cubic-bezier(0.5, 0, 0.75, 0.4)',
  },
}

/**
 * 圆形扩散切换动效（反相擦拭版）：
 * 点击后从按钮中心扩散出一个小圆，圆用 mix-blend-mode: difference + 白色填充，
 * 把圆内的页面像素取反——内容可见且呈现目标主题的配色（近似反相）；
 * 四段节奏（加速弹出 → 惯性溢出 → 回弹到基准 → 加速扩散全屏），弹簧/橡皮筋手感；
 * 圆覆盖全屏的瞬间同步翻转主题。
 *
 * 实现要点：
 * - 遮罩圆用 Portal 挂到 <body>，定位为真·fixed（视口坐标），不受 header 的
 *   backdrop-filter 包含块影响，也不参与任何 flex 布局（不会挤动页面元素）；
 * - 关键样式用内联 style 保证生效，不依赖 Tailwind 类名生成；
 * - 翻转用 Provider 的 setTheme（同步应用 DOM），与隐藏遮罩同帧完成，无闪烁；
 * - 动画异常时回退瞬时切换；安全超时用独立 timer id，点击前先清掉上一次；
 * - 清理旧动画前先摘掉其回调，避免异步 oncancel 污染新动画状态。
 * 尊重 prefers-reduced-motion（直接瞬时切换）。
 */
export function ThemeToggle({ label }: { label: string }) {
  const { theme, toggle, setTheme } = useTheme()
  const reduce = useReducedMotion()
  const btnRef = useRef<HTMLButtonElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const completedRef = useRef(false)
  const unlockTimerRef = useRef<number | null>(null)
  const mounted = useSyncExternalStore(emptySubscribe, isClient, isServer)

  const ghostRef = useRef<HTMLImageElement | null>(null)

  /** 动画期间在 logo 位置盖一个浮层：z-index 高于反相遮罩圆，logo 保持白底不被反相 */
  const showGhostLogo = () => {
    const img = document.querySelector<HTMLImageElement>('header a img')
    if (!img) return
    const r = img.getBoundingClientRect()
    const g = document.createElement('img')
    g.src = img.currentSrc || '/favicon-logo.png'
    g.alt = ''
    g.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:50%;object-fit:cover;z-index:10000;pointer-events:none;`
    document.body.appendChild(g)
    ghostRef.current = g
  }
  const hideGhostLogo = () => {
    ghostRef.current?.remove()
    ghostRef.current = null
  }

  const handleClick = () => {
    if (busyRef.current) return
    const btn = btnRef.current
    const circle = circleRef.current
    if (!btn || !circle) return

    // 系统偏好减弱动效：跳过动画直接切换
    if (reduce) {
      toggle()
      return
    }

    // 动画期间盖浮层，让 logo 不参与反相（保持白底）
    showGhostLogo()

    const next = theme === 'dark' ? 'light' : 'dark'
    // 按钮中心 = 圆扩散的起点（视口坐标，Portal 后与 fixed 定位同一坐标系）
    const rect = btn.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    const { baseDiameter, overshootRatio, recoilTarget, durations, eases } = THEME_TRANSITION
    const overshootPeak = 1 + overshootRatio
    const total = durations.pop + durations.overshoot + durations.recoil + durations.expand

    // 覆盖全屏所需 scale：从按钮中心到最远视口角
    const farCorner = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )
    const coverScale = (farCorner / (baseDiameter / 2)) * 1.02

    const el = circle
    // 清理上一次动画与残留定时器（防止跨点击干扰）：
    // 先摘掉旧动画的回调，避免其 oncancel/onfinish 异步触发时污染本次新动画的状态
    el.getAnimations().forEach((a) => {
      a.onfinish = null
      a.oncancel = null
      a.cancel()
    })
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = null
    }

    // 初始化圆：定位到按钮中心（difference + 白底 = 圆内像素取反）
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.transform = 'translate(-50%, -50%) scale(0)'
    el.style.display = 'block'

    busyRef.current = true
    completedRef.current = false

    const t1 = durations.pop / total
    const t2 = (durations.pop + durations.overshoot) / total
    const t3 = (durations.pop + durations.overshoot + durations.recoil) / total

    let anim: Animation
    try {
      anim = el.animate(
        [
          {
            transform: `translate(-50%, -50%) scale(0)`,
            offset: 0,
            easing: eases.pop,
          },
          {
            transform: `translate(-50%, -50%) scale(1)`,
            offset: t1,
            easing: eases.overshoot,
          },
          {
            transform: `translate(-50%, -50%) scale(${overshootPeak})`,
            offset: t2,
            easing: eases.recoil,
          },
          {
            transform: `translate(-50%, -50%) scale(${recoilTarget})`,
            offset: t3,
            easing: eases.expand,
          },
          {
            transform: `translate(-50%, -50%) scale(${coverScale})`,
            offset: 1,
          },
        ],
        { duration: total * 1000, fill: 'forwards' },
      )
    } catch {
      // 动画不可用时回退为瞬时切换，保证主题切换永不失效
      hideGhostLogo()
      el.style.display = 'none'
      busyRef.current = false
      toggle()
      return
    }

    const finish = () => {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current)
        unlockTimerRef.current = null
      }
      // 此刻圆已覆盖全屏：同步翻转主题（DOM 即时生效），并同帧隐藏遮罩——无闪烁
      setTheme(next)
      hideGhostLogo()
      el.style.display = 'none'
      busyRef.current = false
    }
    anim.onfinish = () => {
      completedRef.current = true
      finish()
    }
    anim.oncancel = () => {
      completedRef.current = true
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current)
        unlockTimerRef.current = null
      }
      hideGhostLogo()
      el.style.display = 'none'
      busyRef.current = false
    }

    // 安全网：仅当本次动画异常停滞（如标签页被隐藏）时才强制完成切换
    unlockTimerRef.current = window.setTimeout(() => {
      unlockTimerRef.current = null
      if (!completedRef.current) {
        el.getAnimations().forEach((a) => a.cancel())
        hideGhostLogo()
        el.style.display = 'none'
        busyRef.current = false
        toggle()
      }
    }, (total + 0.5) * 1000)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        {/* 用 .dark 类控制显隐，避免水合不一致 */}
        <SunIcon className="block h-4 w-4 dark:hidden" />
        <MoonIcon className="hidden h-4 w-4 dark:block" />
      </button>
      {/* 扩散遮罩圆：Portal 到 body，真 fixed + 内联样式，不参与布局、不拦截点击 */}
      {mounted &&
        createPortal(
          <div
            ref={circleRef}
            aria-hidden
            style={{
              position: 'fixed',
              display: 'none',
              width: THEME_TRANSITION.baseDiameter,
              height: THEME_TRANSITION.baseDiameter,
              borderRadius: '9999px',
              pointerEvents: 'none',
              background: '#fff',
              mixBlendMode: 'difference',
              transform: 'translate(-50%, -50%) scale(0)',
              zIndex: 9999,
              willChange: 'transform',
            }}
          />,
          document.body,
        )}
    </>
  )
}
