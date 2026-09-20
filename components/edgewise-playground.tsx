'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/locale'

gsap.registerPlugin(useGSAP)

type RGB = readonly [number, number, number]

interface PixelSample {
  id: string
  area: { zh: string; en: string }
  x: number
  y: number
  edge: RGB
  interior: RGB
  after: readonly [number, number, number, number]
  brightness: number
  wallMatch: number
  score: number
  force: boolean
  reasons: { zh: string[]; en: string[] }
}

const FRAME = { width: 343, height: 245, zoom: 6 }
const REMOVE_THRESHOLD = 0.4
const KEEP_FLOOR = 0.3

// 坐标、RGB 与处理后 RGBA 取自 Edgewise 的 desk8 f01 前后帧。
// 当前环境没有 Jev 凭据，score 仅用于演示三段式裁决，不冒充线上模型响应。
const SAMPLES: PixelSample[] = [
  {
    id: 'hair-crown',
    area: { zh: '头发顶部', en: 'Hair crown' },
    x: 135,
    y: 20,
    edge: [227, 236, 245],
    interior: [7, 8, 9],
    after: [116, 122, 132, 204],
    brightness: 227,
    wallMatch: 0.88,
    score: 0.91,
    force: true,
    reasons: {
      zh: ['边缘明显更亮', '颜色接近墙面', '主体内部接近黑色'],
      en: ['Edge is much brighter', 'Color resembles the wall', 'Interior is near-black'],
    },
  },
  {
    id: 'plant-leaf',
    area: { zh: '植物叶片', en: 'Plant leaf' },
    x: 24,
    y: 80,
    edge: [226, 239, 244],
    interior: [12, 30, 16],
    after: [127, 145, 140, 204],
    brightness: 213,
    wallMatch: 0.81,
    score: 0.82,
    force: true,
    reasons: {
      zh: ['绿色饱和度流失', '亮度异常抬升', '符合墙色混入模型'],
      en: ['Green saturation is lost', 'Brightness rises sharply', 'Matches the wall-blend model'],
    },
  },
  {
    id: 'chair-edge',
    area: { zh: '椅背轮廓', en: 'Chair edge' },
    x: 67,
    y: 109,
    edge: [245, 251, 255],
    interior: [0, 0, 0],
    after: [40, 42, 48, 197],
    brightness: 250,
    wallMatch: 0.96,
    score: 0.97,
    force: true,
    reasons: {
      zh: ['近乎纯墙色', '紧邻深色主体', '规则置信度极高'],
      en: ['Almost pure wall color', 'Touches a dark subject', 'Very high rule confidence'],
    },
  },
  {
    id: 'desk-rim',
    area: { zh: '桌面下缘', en: 'Desk rim' },
    x: 41,
    y: 191,
    edge: [230, 238, 246],
    interior: [15, 22, 41],
    after: [114, 121, 137, 204],
    brightness: 214,
    wallMatch: 0.79,
    score: 0.74,
    force: true,
    reasons: {
      zh: ['边缘发灰', '与内部色差过大', '局部背景证据较强'],
      en: ['Edge is washed out', 'Large interior color distance', 'Strong local background evidence'],
    },
  },
  {
    id: 'hair-detail',
    area: { zh: '头发高光', en: 'Hair highlight' },
    x: 88,
    y: 37,
    edge: [163, 174, 180],
    interior: [0, 7, 14],
    after: [163, 174, 180, 255],
    brightness: 166,
    wallMatch: 0.46,
    score: 0.35,
    force: false,
    reasons: {
      zh: ['可能是人工高光', '墙色证据不充分', '需要语义复核'],
      en: ['Could be authored highlight', 'Weak wall-color evidence', 'Needs semantic review'],
    },
  },
  {
    id: 'subject-detail',
    area: { zh: '椅子高光', en: 'Chair highlight' },
    x: 49,
    y: 145,
    edge: [232, 239, 243],
    interior: [37, 42, 53],
    after: [232, 239, 243, 255],
    brightness: 196,
    wallMatch: 0.34,
    score: 0.18,
    force: false,
    reasons: {
      zh: ['像素保持完全不透明', '更像主体高光', 'Jev 应保护细节'],
      en: ['Pixel stays fully opaque', 'Looks like subject highlight', 'Jev should protect detail'],
    },
  },
]

const COPY = {
  zh: {
    stage: 'PIXEL FORENSICS LAB',
    live: 'LIVE INSPECTION',
    paused: 'MANUAL CONTROL',
    source: '原始帧',
    result: '处理后',
    target: '当前代表像素',
    position: '坐标',
    edgePixel: '边缘像素',
    interiorPixel: '内部参照',
    brightness: '亮度差',
    wallMatch: '墙色匹配',
    rule: '规则判断',
    forced: '高置信候选',
    review: '需要复核',
    score: 'JEV 污染概率',
    threshold: '移除阈值',
    blend: '修正结果',
    keep: '保留主体细节',
    uncertain: '保持不确定',
    remove: '拉回内部颜色并收紧 Alpha',
    previous: '上一个',
    next: '下一个',
    play: '自动播放',
    pause: '暂停',
    compare: '拖动查看前后帧',
    note: 'JEV 分数为交互演示值；像素坐标、颜色和处理后 RGBA 来自真实 desk8 帧。',
    stages: ['扫描边缘', '锁定样本', '规则证据', 'JEV 裁决', '像素修正'],
  },
  en: {
    stage: 'PIXEL FORENSICS LAB',
    live: 'LIVE INSPECTION',
    paused: 'MANUAL CONTROL',
    source: 'Source',
    result: 'Processed',
    target: 'Representative pixel',
    position: 'Position',
    edgePixel: 'Edge pixel',
    interiorPixel: 'Interior reference',
    brightness: 'Brightness delta',
    wallMatch: 'Wall match',
    rule: 'Rule verdict',
    forced: 'High-confidence candidate',
    review: 'Needs review',
    score: 'JEV contamination',
    threshold: 'Remove threshold',
    blend: 'Correction',
    keep: 'Protect subject detail',
    uncertain: 'Leave uncertain',
    remove: 'Pull toward interior and tighten alpha',
    previous: 'Previous',
    next: 'Next',
    play: 'Auto play',
    pause: 'Pause',
    compare: 'Drag to compare frames',
    note: 'JEV scores are interaction demo values; coordinates, colors, and processed RGBA come from the real desk8 frame.',
    stages: ['Scan edge', 'Lock sample', 'Rule evidence', 'JEV verdict', 'Patch pixel'],
  },
} as const

function rgb(value: readonly number[]) {
  return `rgb(${value[0]}, ${value[1]}, ${value[2]})`
}

function verdictFor(score: number, threshold: number) {
  if (score < KEEP_FLOOR) return 'keep'
  if (score > threshold) return 'remove'
  return 'uncertain'
}

export function EdgewisePlayground({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)
  const [sampleIndex, setSampleIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [compare, setCompare] = useState(0)
  const [threshold, setThreshold] = useState(REMOVE_THRESHOLD)

  const t = COPY[locale]
  const sample = SAMPLES[sampleIndex]
  const verdict = verdictFor(sample.score, threshold)
  const verdictText =
    verdict === 'remove' ? t.remove : verdict === 'keep' ? t.keep : t.uncertain
  const reasons = sample.reasons[locale]

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      const timeline = gsap.timeline()
      timeline
        .fromTo(
          '[data-scan-line]',
          { yPercent: -140, autoAlpha: 0 },
          { yPercent: 340, autoAlpha: 1, duration: 0.75, ease: 'power2.inOut' },
        )
        .to('[data-scan-line]', { autoAlpha: 0, duration: 0.15 })
        .fromTo(
          '[data-target-marker]',
          { autoAlpha: 0, scale: 2.2, rotation: -18 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.48, ease: 'back.out(1.8)' },
          '-=0.18',
        )
        .fromTo(
          '[data-loupe]',
          { autoAlpha: 0, scale: 0.72 },
          { autoAlpha: 1, scale: 1, duration: 0.48, ease: 'back.out(1.5)' },
          '<0.08',
        )
        .fromTo(
          '[data-evidence-card]',
          { autoAlpha: 0, x: 24 },
          { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out' },
          '<0.08',
        )
        .fromTo(
          '[data-score-fill]',
          { scaleX: 0 },
          { scaleX: sample.score, duration: 0.7, ease: 'power3.out' },
          '-=0.1',
        )
    },
    { scope: root, dependencies: [sampleIndex], revertOnUpdate: true },
  )

  useEffect(() => {
    if (!playing) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const revealResult = window.setTimeout(() => setCompare(100), 3200)
    const advance = window.setTimeout(
      () => {
        setCompare(0)
        setSampleIndex((current) => (current + 1) % SAMPLES.length)
      },
      5000,
    )
    return () => {
      window.clearTimeout(revealResult)
      window.clearTimeout(advance)
    }
  }, [playing, sampleIndex])

  const moveSample = (direction: -1 | 1) => {
    setPlaying(false)
    setCompare(0)
    setSampleIndex((current) => (current + direction + SAMPLES.length) % SAMPLES.length)
  }

  const style = {
    '--sample-x': `${(sample.x / FRAME.width) * 100}%`,
    '--sample-y': `${(sample.y / FRAME.height) * 100}%`,
    '--compare': `${compare}%`,
    '--loupe-image': `url(${compare >= 50 ? '/projects/edgewise/after.png' : '/projects/edgewise/before.png'})`,
    '--loupe-size': `${FRAME.width * FRAME.zoom}px ${FRAME.height * FRAME.zoom}px`,
    '--loupe-position': `calc(50% - ${sample.x * FRAME.zoom}px) calc(50% - ${sample.y * FRAME.zoom}px)`,
  } as CSSProperties

  return (
    <div ref={root} className="edgewise-lab" style={style}>
      <div className="edgewise-lab-topbar font-pixel">
        <span>{t.stage}</span>
        <span className={playing ? 'is-live' : ''}>{playing ? t.live : t.paused}</span>
      </div>

      <div className="edgewise-workbench">
        <section className="edgewise-viewport" aria-label={t.compare}>
          <div className="edgewise-frame">
            {/* Canvas-like image stack keeps every source pixel crisp while the DOM HUD stays accessible. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/projects/edgewise/before.png" alt="Desk sprite before Edgewise processing" />
            <div className="edgewise-after-layer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/projects/edgewise/after.png" alt="Desk sprite after Edgewise processing" />
            </div>
            <div className="edgewise-scan-line" data-scan-line />
            <div className="edgewise-target-marker" data-target-marker>
              <span />
            </div>
            <div className="edgewise-frame-grid" />
            <div className="edgewise-frame-labels font-pixel">
              <span>{t.source}</span>
              <span>{t.result}</span>
            </div>
          </div>

          <div className="edgewise-loupe" data-loupe data-inspection-ui aria-hidden="true">
            <div className="edgewise-loupe-image" />
            <div className="edgewise-loupe-grid" />
            <div className="edgewise-loupe-pixel" />
            <span className="edgewise-loupe-coord font-pixel">
              X{sample.x} Y{sample.y}
            </span>
          </div>

          <label className="edgewise-compare-control">
            <span className="font-pixel">BEFORE</span>
            <input
              aria-label={t.compare}
              type="range"
              min="0"
              max="100"
              value={compare}
              onChange={(event) => {
                setPlaying(false)
                setCompare(Number(event.target.value))
              }}
            />
            <span className="font-pixel">AFTER</span>
          </label>
        </section>

        <aside
          className="edgewise-evidence"
          data-evidence-card
          data-inspection-ui
          data-verdict={verdict}
          aria-live="polite"
        >
          <div className="edgewise-evidence-heading">
            <div>
              <p className="font-pixel">{t.target}</p>
              <h2>{sample.area[locale]}</h2>
            </div>
            <span className="edgewise-sample-count font-pixel">
              {String(sampleIndex + 1).padStart(2, '0')} / {String(SAMPLES.length).padStart(2, '0')}
            </span>
          </div>

          <dl className="edgewise-pixel-data">
            <div>
              <dt>{t.position}</dt>
              <dd className="font-pixel">{sample.x}, {sample.y}</dd>
            </div>
            <div>
              <dt>{t.edgePixel}</dt>
              <dd>
                <span className="edgewise-swatch" style={{ background: rgb(sample.edge) }} />
                <code>{sample.edge.join(' ')}</code>
              </dd>
            </div>
            <div>
              <dt>{t.interiorPixel}</dt>
              <dd>
                <span className="edgewise-swatch" style={{ background: rgb(sample.interior) }} />
                <code>{sample.interior.join(' ')}</code>
              </dd>
            </div>
            <div>
              <dt>{t.brightness}</dt>
              <dd className="font-pixel">+{sample.brightness}</dd>
            </div>
            <div>
              <dt>{t.wallMatch}</dt>
              <dd className="font-pixel">{Math.round(sample.wallMatch * 100)}%</dd>
            </div>
            <div>
              <dt>{t.rule}</dt>
              <dd className="font-pixel">{sample.force ? t.forced : t.review}</dd>
            </div>
          </dl>

          <ul className="edgewise-reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>

          <div className="edgewise-score-block">
            <div className="edgewise-score-label">
              <span>{t.score}</span>
              <strong className="font-pixel">{sample.score.toFixed(2)}</strong>
            </div>
            <div className="edgewise-score-track">
              <span data-score-fill />
              <i style={{ left: `${threshold * 100}%` }} />
            </div>
            <label className="edgewise-threshold">
              <span>{t.threshold}</span>
              <input
                type="range"
                min="30"
                max="80"
                step="1"
                value={Math.round(threshold * 100)}
                onChange={(event) => {
                  setPlaying(false)
                  setThreshold(Number(event.target.value) / 100)
                }}
              />
              <code>{threshold.toFixed(2)}</code>
            </label>
          </div>

          <div className="edgewise-verdict">
            <span className="font-pixel">{verdict.toUpperCase()}</span>
            <p>{verdictText}</p>
            <code>RGBA {sample.after.join(' ')}</code>
          </div>
        </aside>
      </div>

      <div className="edgewise-controls">
        <button type="button" onClick={() => moveSample(-1)}>
          <span aria-hidden="true">←</span> {t.previous}
        </button>
        <button
          type="button"
          className="edgewise-play-button font-pixel"
          onClick={() => {
            if (!playing) setCompare(0)
            setPlaying((current) => !current)
          }}
        >
          {playing ? 'Ⅱ' : '▶'} {playing ? t.pause : t.play}
        </button>
        <button type="button" onClick={() => moveSample(1)}>
          {t.next} <span aria-hidden="true">→</span>
        </button>
      </div>

      <ol className="edgewise-stage-list">
        {t.stages.map((stage, index) => (
          <li key={stage}>
            <span className="font-pixel">0{index + 1}</span>
            {stage}
          </li>
        ))}
      </ol>

      <p className="edgewise-demo-note">{t.note}</p>
    </div>
  )
}
