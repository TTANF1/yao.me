'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface PhoneFrameProps {
  videos: { src: string; label: string }[]
}

/** iPhone 17 透明框架素材（屏幕区域为透明） */
const MOCKUP_SRC = '/mockup-apple-iphone-17.webp'

/**
 * iPhone 演示框架：
 * - 透明框架图片作为机身，视频透过透明屏幕区域显示
 * - 轮播使用原生 scroll-snap：横向滚动交给浏览器合成器线程处理，
 *   真机（iOS/Android）手势跟手、惯性、过半吸附切换 / 不过半回弹全部原生实现，
 *   避免 JS 驱动 scrollLeft 在主线程掉帧导致的"滑动卡住、一次只能滑一点"。
 * - 页面垂直滚动不受影响（touch-action: pan-y）。
 * - 指示点点击切换（原生平滑滚动）；只有当前可见（>50%）的视频才播放。
 */
export default function PhoneFrame({ videos }: PhoneFrameProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number } | null>(null)
  const [active, setActive] = useState(0)

  // 仅鼠标拖拽兼容：桌面端鼠标按住拖动横向滚动。
  // 触屏（pointerType !== 'mouse'）一律不拦截、走原生 scroll-snap，保证手机端流畅。
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = scrollerRef.current
      const s = dragRef.current
      if (!el || !s || e.pointerType !== 'mouse' || e.pointerId !== s.pointerId) return
      el.scrollLeft = s.startScroll - (e.clientX - s.startX)
    }
    const onUp = (e: PointerEvent) => {
      const s = dragRef.current
      if (s && e.pointerType === 'mouse' && e.pointerId === s.pointerId) dragRef.current = null
    }
    const onCancel = (e: PointerEvent) => {
      const s = dragRef.current
      if (s && e.pointerType === 'mouse' && e.pointerId === s.pointerId) dragRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: scrollerRef.current?.scrollLeft ?? 0,
    }
  }

  // 滚动同步指示点（原生滚动 / 点击切换过程中实时更新）
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

  const scrollTo = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
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
            className="no-scrollbar flex h-full cursor-grab snap-x snap-mandatory touch-pan-y overflow-x-auto active:cursor-grabbing"
          >
            {videos.map((v, i) => (
              <div key={v.src} className="h-full w-full shrink-0 snap-start">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  src={v.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="pointer-events-none h-full w-full object-contain"
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

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
