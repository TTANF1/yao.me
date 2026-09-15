'use client'

import type { Company } from '@/lib/projects-data'
import { useEffect, useRef, useState } from 'react'

interface ProjectCardProps {
  company: Company
}

/**
 * 项目卡片 —— 按公司维度汇总的简约卡片：
 * 统一渲染逻辑（公司名 / 职位 / 时间 / 总结），不含 demo 判断。
 * 卡片底部有一条"公路"样式装饰线（两侧实线 + 中间虚线），
 * 进入视口时触发延伸动画，虚线画完后持续流动。
 */
export default function ProjectCard({ company }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative z-10 mx-auto w-full max-w-[420px]">
      <article className="rounded-2xl border border-line bg-background p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{company.name}</h2>
        <p className="mt-1.5 text-sm text-muted">
          {company.role} · {company.period}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80 sm:text-[15px]">
          {company.summary}
        </p>

        {/* 公路样式装饰线：进入视口后延伸绘制 */}
        {shown ? (
          <svg
            className="mt-6 block h-3 w-full"
            viewBox="0 0 420 12"
            fill="none"
            aria-hidden
          >
            <line
              className="road-solid"
              x1="0"
              y1="1.5"
              x2="420"
              y2="1.5"
              stroke="var(--muted)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <line
              className="road-solid"
              x1="0"
              y1="10.5"
              x2="420"
              y2="10.5"
              stroke="var(--muted)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <line
              className="road-dash"
              x1="0"
              y1="6"
              x2="420"
              y2="6"
              stroke="var(--muted)"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div className="mt-6 h-3" aria-hidden />
        )}
      </article>
    </div>
  )
}
