'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface PhoneFrameProps {
  videos: { src: string; label: string }[]
}

/** iPhone 17 透明框架素材（屏幕区域为透明） */
const MOCKUP_SRC = '/mockup-apple-iphone-17.webp'

interface DragState {
  pointerId: number
  startX: number
  startScroll: number
  dragging: boolean
  moved: boolean
  lastX: number
  lastT: number
  vx: number // px/ms，指数平滑后的瞬时速度（负 = 手指向左）
}

/** easeOutQuart：前快后慢，切换顺滑到位 */
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** easeOutBack：带轻微过冲的回弹，适合松手未过半时丝滑归位 */
const easeOutBack = (t: number, s = 1.4) => {
  const c1 = s + 1
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * iPhone 演示框架：
 * - 透明框架图片作为机身，视频透过透明屏幕区域显示
 * - 完全自定义轮播交互（不依赖 scroll-snap 的急停吸附）：
 *   拖拽跟手 → 松手按「位移过半 + 甩动速度」判定切换或回弹
 *   → JS 缓动曲线驱动（切换顺滑 / 回弹带轻微过冲）
 * - pointermove/up 挂 window 监听，拖出屏幕区域也能正确收尾
 * - 指示点点击切换、触摸横向拖动、鼠标拖拽三路操作
 * - 只有当前可见（>50%）的视频才播放
 */
export default function PhoneFrame({ videos }: PhoneFrameProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const dragRef = useRef<DragState | null>(null)
  const animRef = useRef(0)
  const [active, setActive] = useState(0)

  // 滚动同步指示点（拖拽 / 动画过程中实时更新）
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const w = el.clientWidth || 1
      const idx = Math.round(el.scrollLeft / w)
      setActive(clamp(idx, 0, videos.length - 1))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [videos.length])

  // 可见性驱动播放：仅播放当前滑到的视频
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            v.play().catch(() => {})
          } else {
            v.pause()
          }
        }
      },
      { threshold: 0.5 },
    )
    for (const v of videoRefs.current) if (v) io.observe(v)
    return () => io.disconnect()
  }, [videos.length])

  /** 自定义缓动动画驱动 scrollLeft（物理惯性衔接：起点带速、缓出减速） */
  const animateScroll = (target: number, opts?: { overshoot?: boolean }) => {
    const el = scrollerRef.current
    if (!el) return
    cancelAnimationFrame(animRef.current)
    const from = el.scrollLeft
    const dist = Math.abs(target - from)
    if (dist < 0.5) return
    // 物理感时长：位移越大动画略长，但始终落在舒适区间
    const dur = clamp(380 + dist * 0.4, 320, 760)
    const start = performance.now()
    const ease = opts?.overshoot ? easeOutBack : easeOutQuart
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      el.scrollLeft = from + (target - from) * ease(t)
      if (t < 1) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }

  // 拖拽跟踪：move/up/cancel 挂 window，避免 pointer capture 兼容问题
  useEffect(() => {
    /** 松手判定：位移过半 或 甩动速度达到阈值 → 切换；否则回弹（轻微过冲） */
    const settle = () => {
      const el = scrollerRef.current
      const s = dragRef.current
      if (!el || !s) return
      s.dragging = false
      const w = el.clientWidth
      const dx = el.scrollLeft - s.startScroll
      const vx = s.vx
      let idx = active
      const half = w * 0.5
      if (dx > half || vx < -0.35) idx = active + 1
      else if (dx < -half || vx > 0.35) idx = active - 1
      idx = clamp(idx, 0, videos.length - 1)
      // 未切换（回弹）带轻微过冲；切换用顺滑缓动
      animateScroll(idx * w, { overshoot: idx === active })
      dragRef.current = null
    }

    const onMove = (e: PointerEvent) => {
      const el = scrollerRef.current
      const s = dragRef.current
      if (!el || !s?.dragging || e.pointerId !== s.pointerId) return
      const now = performance.now()
      const dx = e.clientX - s.lastX
      const dt = now - s.lastT
      if (dt > 0 && Math.abs(dx) > 0) {
        // 指数平滑瞬时速度（兼顾最近动作的惯性）
        s.vx = 0.7 * s.vx + 0.3 * (dx / dt)
      }
      s.lastX = e.clientX
      s.lastT = now
      const totalDx = e.clientX - s.startX
      if (Math.abs(totalDx) > 8) s.moved = true
      // 跟手：手指移动多少，内容移动多少
      el.scrollLeft = s.startScroll - totalDx
    }

    const onUp = (e: PointerEvent) => {
      const s = dragRef.current
      if (!s || e.pointerId !== s.pointerId) return
      settle()
    }

    const onCancel = (e: PointerEvent) => {
      const s = dragRef.current
      if (s && e.pointerId === s.pointerId) {
        s.dragging = false
        dragRef.current = null
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [active, videos.length])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    if (!el) return
    cancelAnimationFrame(animRef.current)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      dragging: true,
      moved: false,
      lastX: e.clientX,
      lastT: performance.now(),
      vx: 0,
    }
  }

  const scrollTo = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    animateScroll(i * el.clientWidth)
  }

  return (
    <div className="relative mx-auto w-full max-w-[220px] select-none">
      {/* 机身比例容器：388x800 */}
      <div className="relative w-full" style={{ aspectRatio: '388 / 800' }}>
        {/* 视频轮播层（在机身透明屏幕区域之下） */}
        <div
          className="absolute z-0 overflow-hidden rounded-[8%] bg-black"
          style={{ left: '2.84%', top: '1.63%', right: '3.09%', bottom: '1.75%' }}
        >
          <div
            ref={scrollerRef}
            onPointerDown={onPointerDown}
            className="no-scrollbar flex h-full cursor-grab touch-pan-y overflow-x-auto active:cursor-grabbing"
          >
            {videos.map((v, i) => (
              <div key={v.src} className="h-full w-full shrink-0">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  src={v.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 机身框架层（透明屏幕区域露出下方视频） */}
        <Image
          src={MOCKUP_SRC}
          alt=""
          fill
          priority
          sizes="220px"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />
      </div>

      {/* 指示点 + 当前标签：绝对定位在机身下方，不撑高 flex 布局 */}
      <div className="absolute inset-x-0 -bottom-11 flex flex-col items-center">
        <div className="flex items-center justify-center gap-2">
          {videos.map((v, i) => (
            <button
              key={v.src}
              type="button"
              aria-label={v.label}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-5 bg-foreground/70'
                  : 'w-1.5 bg-foreground/25 hover:bg-foreground/40'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">{videos[active]?.label}</p>
      </div>
    </div>
  )
}
