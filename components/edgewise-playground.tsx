'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/locale'
import data from '@/lib/edgewise-colors.json'

gsap.registerPlugin(useGSAP)

const GROUPS = data.groups
const PARTICLES = GROUPS.flatMap((group, groupIndex) =>
  group.pixels.map((pixel, pointIndex) => ({ ...pixel, groupIndex, pointIndex, rgb: group.rgb })),
)
const COPY = {
  zh: {
    pull: '拉开，让颜色归队', source: '原位', gathered: '按颜色归组',
    reset: '重来', select: '选一个颜色组，看看它们来自哪里。',
    start: '向右拖动拉环，把散落的候选像素收成颜色组。',
    returning: '沿原路归位…', returned: '这一组已归位', apply: '让这一组归位',
    complete: '六组颜色，回到各自的位置。', pixels: '处同色候选', groups: '个颜色组',
    repair: '加强修正', protect: '减轻修正', uncertain: '保守处理',
    repairReason: '演示分数越过修正阈值，由图形规则执行颜色与透明度修正。',
    protectReason: '演示判断倾向主体细节，降低规则的强修正，保留基础处理。',
    uncertainReason: '演示判断落在不确定区，不追加语义修正，仍遵循基础与强制规则。',
    demo: 'JEV 判断演示', evidence: '代表像素', inside: '内部参照',
    provenance: '真实像素 · 演示判断',
    note: '这 30 个候选像素是 desk8 首帧中出现次数最多的 6 种候选颜色，来自确定性规则提取。JEV 分数为预设演示值；归位颜色由真实图形管线使用这些分数计算，仅应用到选中的样本组。画面已完成背景移除，未展示的像素不会随操作改变。',
    subset: '展示子集', full: '全帧提取', colors: '种颜色', applied: '组已归位',
  },
  en: {
    pull: 'Pull the colors together', source: 'In place', gathered: 'Grouped by color',
    reset: 'Reset', select: 'Choose a color. See where its pixels belong.',
    start: 'Drag the ring to gather scattered candidate pixels by color.',
    returning: 'Finding their way back…', returned: 'This group is back', apply: 'Send this group home',
    complete: 'Six colors. Back where they belong.', pixels: 'matching candidates', groups: 'color groups',
    repair: 'Stronger correction', protect: 'Gentler correction', uncertain: 'Conservative treatment',
    repairReason: 'The demo score crosses the repair threshold; graphics rules adjust color and alpha.',
    protectReason: 'The demo favors subject detail, reducing forced correction while retaining the base treatment.',
    uncertainReason: 'The demo falls in the uncertain band: no extra semantic correction; base and force rules still apply.',
    demo: 'JEV demo judgment', evidence: 'Representative pixel', inside: 'Interior reference',
    provenance: 'Real pixels · demo judgments',
    note: 'These 30 candidates are the six most frequent candidate colors extracted from desk8 frame 1 by deterministic rules. JEV scores are authored demo values. Return colors are computed by the real graphics pipeline with those scores, and applied only to the selected sample group. Background removal is already complete; unsampled pixels remain unchanged.',
    subset: 'Shown subset', full: 'Full-frame extraction', colors: 'colors', applied: 'groups returned',
  },
} as const

function layout(compact: boolean) {
  return compact
    ? { width: 420, height: 530, image: { x: 38.5, y: 132, scale: 1 }, hubs: [[70, 65], [210, 65], [350, 65], [70, 448], [210, 448], [350, 448]] }
    : { width: 1000, height: 610, image: { x: 157, y: 60, scale: 2 }, hubs: [[62, 115], [62, 305], [62, 495], [938, 115], [938, 305], [938, 495]] }
}

export function EdgewisePlayground({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)
  const [spread, setSpread] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [returned, setReturned] = useState<number[]>([])
  const [returning, setReturning] = useState<number | null>(null)
  const [compact, setCompact] = useState(false)
  const maskId = useId().replaceAll(':', '')
  const sliderId = useId()
  const t = COPY[locale]
  const scene = layout(compact)
  const ready = spread >= 85
  const sample = selected === null ? null : GROUPS[selected]
  const verdict = sample ? sample.demoScore < 0.3 ? 'protect' : sample.demoScore > 0.4 ? 'repair' : 'uncertain' : null
  const done = selected !== null && returned.includes(selected)
  const allDone = returned.length === GROUPS.length

  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 620))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { image, hubs } = layout(compact)
    const amount = (index: number) => returned.includes(PARTICLES[index].groupIndex) || returning === PARTICLES[index].groupIndex ? 0 : spread / 100
    const point = (index: number) => {
      const pixel = PARTICLES[index]
      const p = amount(index)
      const [hubX, hubY] = hubs[pixel.groupIndex]
      const startX = image.x + pixel.x * image.scale
      const startY = image.y + pixel.y * image.scale
      const endX = hubX + (pixel.pointIndex % 3 - 1) * 13 - 5
      const endY = hubY + (Math.floor(pixel.pointIndex / 3) - .5) * 13 - 5
      // Deterministic curved travel. Positions remain reversible while scrubbing.
      const bend = Math.sin(p * Math.PI) * (pixel.groupIndex % 2 ? 20 : -20)
      return { x: startX + (endX - startX) * p, y: startY + (endY - startY) * p + bend }
    }
    const tween = gsap.to('[data-cohort-particle]', {
      attr: {
        x: (index: number) => point(index).x,
        y: (index: number) => point(index).y,
        width: (index: number) => image.scale + (10 - image.scale) * amount(index),
        height: (index: number) => image.scale + (10 - image.scale) * amount(index),
      },
      duration: reduce ? 0 : returning !== null ? .7 : spread > 0 && spread < 100 ? .12 : .55,
      ease: returning !== null ? 'power3.inOut' : 'power2.out',
      overwrite: true,
      onComplete: () => {
        if (returning !== null) {
          setReturned((current) => current.includes(returning) ? current : [...current, returning])
          setReturning(null)
        }
      },
    })
    return () => { tween.kill() }
  }, { scope: root, dependencies: [spread, compact, returning, returned] })

  const choose = (index: number) => {
    if (returning !== null) return
    setSelected(index)
    setSpread(100)
  }

  return (
    <div ref={root} className="color-gather" data-compact={compact || undefined} data-ready={ready || undefined}>
      <div className="color-gather-meta" aria-hidden="true">
        <span>DESK8 / F01</span>
        <span>{data.sampledPixelCount} PX <span className="color-gather-meta-arrow">→</span> {GROUPS.length} {locale === 'zh' ? '色组' : 'COLORS'}</span>
      </div>

      <div className="color-gather-stage" style={{ aspectRatio: scene.width + ' / ' + scene.height }}>
        <svg viewBox={`0 0 ${scene.width} ${scene.height}`} aria-hidden="true">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={scene.width} height={scene.height}>
              <rect width={scene.width} height={scene.height} fill="white" />
              {PARTICLES.filter((p) => returned.includes(p.groupIndex)).map((p) => (
                <rect key={p.x + '-' + p.y} x={scene.image.x + p.x * scene.image.scale} y={scene.image.y + p.y * scene.image.scale} width={scene.image.scale} height={scene.image.scale} fill="black" />
              ))}
            </mask>
          </defs>
          <g opacity={1 - spread / 100 * .32}>
            <image href="/projects/edgewise/candidates-source.png" x={scene.image.x} y={scene.image.y} width={data.width * scene.image.scale} height={data.height * scene.image.scale} mask={`url(#${maskId})`} style={{ imageRendering: 'pixelated' }} />
            {PARTICLES.filter((p) => returned.includes(p.groupIndex)).map((p) => (
              <rect key={p.x + '-' + p.y} x={scene.image.x + p.x * scene.image.scale} y={scene.image.y + p.y * scene.image.scale} width={scene.image.scale} height={scene.image.scale} fill={`rgba(${p.after[0]}, ${p.after[1]}, ${p.after[2]}, ${p.after[3] / 255})`} />
            ))}
          </g>
          {selected !== null && ready && GROUPS[selected].pixels.map((p, i) => {
            const x = scene.image.x + (p.x + .5) * scene.image.scale
            const y = scene.image.y + (p.y + .5) * scene.image.scale
            const [hx, hy] = scene.hubs[selected]
            return (
              <g key={i} className="color-gather-origin">
                {!done && <path d={`M ${x} ${y} Q ${hx} ${y} ${hx} ${hy}`} />}
                <rect x={x - 4} y={y - 4} width="8" height="8" />
              </g>
            )
          })}
          {PARTICLES.map((p, i) => (
            <rect
              key={p.x + '-' + p.y}
              data-cohort-particle
              x={scene.image.x + p.x * scene.image.scale}
              y={scene.image.y + p.y * scene.image.scale}
              width={scene.image.scale}
              height={scene.image.scale}
              fill={`rgb(${p.rgb.join(' ')})`}
              stroke="var(--foreground)"
              strokeWidth={spread / 100 * .5}
              opacity={returned.includes(p.groupIndex) ? 0 : selected !== null && p.groupIndex !== selected ? .4 : spread > 0 ? 1 : 0}
              data-particle-index={i}
            />
          ))}
        </svg>
        {GROUPS.map((group, index) => (
          <button
            key={group.id}
            type="button"
            className="color-gather-hub"
            aria-label={`${group.id}, RGB ${group.rgb.join(', ')}, ${group.pixels.length} ${t.pixels}`}
            aria-pressed={selected === index}
            disabled={!ready || returning !== null}
            data-returned={returned.includes(index) || undefined}
            style={{ left: scene.hubs[index][0] / scene.width * 100 + '%', top: scene.hubs[index][1] / scene.height * 100 + '%' }}
            onClick={() => choose(index)}
          >
            <span>{group.id}</span>
            <span className="color-gather-hub-check" aria-hidden="true">{returned.includes(index) ? '↙' : ''}</span>
            <span>{group.pixels.length} PX {returned.includes(index) ? '✓' : ''}</span>
          </button>
        ))}
      </div>

      <div className="color-gather-pull">
        <div className="color-gather-pull-label">
          <label htmlFor={sliderId}>{t.pull}</label>
          <button type="button" disabled={returning !== null || (spread === 0 && returned.length === 0)} onClick={() => {
            setSpread(0)
            setSelected(null)
            setReturned([])
          }}>{t.reset} ↺</button>
        </div>
        <input id={sliderId} type="range" min="0" max="100" step="1" value={spread} disabled={returning !== null}
          aria-valuetext={`${spread}% · ${t.source} → ${t.gathered}`}
          style={{ '--gather-progress': spread + '%' } as CSSProperties}
          onChange={(event) => setSpread(Number(event.target.value))}
        />
        <div className="color-gather-pull-ends" aria-hidden="true"><span>{t.source}</span><span>{t.gathered}</span></div>
      </div>

      <div className="color-gather-verdict" aria-live="polite" aria-atomic="true">
        {sample && verdict && ready ? (
          <>
            <div className="color-gather-verdict-copy">
              <p className="color-gather-verdict-heading"><span className="color-gather-swatch" style={{ background: `rgb(${sample.rgb.join(' ')})` }} />{sample.id}<span>{sample.pixels.length} {t.pixels}</span></p>
              <p><strong>{t[verdict]}</strong><span className="color-gather-score">{t.demo} / {sample.demoScore.toFixed(2)}</span></p>
              <p className="color-gather-reason">{t[`${verdict}Reason`]}</p>
              <span className="color-gather-evidence">{t.evidence} {sample.representative.x},{sample.representative.y} · RGB {sample.rgb.join('/')} → {t.inside} {sample.representative.interior.join('/')}</span>
            </div>
            <button className="color-gather-apply" type="button" disabled={done || returning !== null} onClick={() => setReturning(selected)}>
              {returning !== null ? t.returning : done ? t.returned + ' ✓' : t.apply + ' ↙'}
            </button>
          </>
        ) : (
          <p className="color-gather-prompt">{allDone ? t.complete : ready ? t.select : t.start}</p>
        )}
      </div>
      <details className="color-gather-note">
        <summary>{t.provenance}<span aria-hidden="true"> +</span></summary>
        <p>{t.note}</p>
        <p>{t.subset}: {data.sampledPixelCount} px / {GROUPS.length} {t.colors} · {t.full}: {data.candidateCount} px / {data.colorCount} {t.colors}</p>
      </details>
      <span className="sr-only">{returned.length} / {GROUPS.length} {t.applied}</span>
    </div>
  )
}
