'use client'

import { useEffect, useRef } from 'react'

interface MermaidRendererProps {
  html: string
}

/**
 * Markdown 正文渲染器：渲染 contentHtml，并把其中的 mermaid 代码块
 * （pre > code.language-mermaid）渲染成 SVG 流程图。
 *
 * - 渲染容器插在原代码块之后，原代码块隐藏但保留在 DOM 中（渲染失败时回退展示源码）；
 * - 跟随 <html> 上的 .dark 类（主题切换）重新渲染，流程图适配明暗主题；
 * - mermaid 动态 import，只在存在 mermaid 代码块的页面加载。
 */
export default function MermaidRenderer({ html }: MermaidRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let disposed = false
    let observer: MutationObserver | null = null
    let mermaidMod: typeof import('mermaid') | null = null

    const getTheme = () =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'default'

    const ensureMermaid = async () => {
      if (!mermaidMod) {
        mermaidMod = await import('mermaid')
      }
      mermaidMod.default.initialize({
        startOnLoad: false,
        theme: getTheme(),
      })
      return mermaidMod
    }

    const renderBlock = async (
      pre: HTMLPreElement,
      mm: typeof import('mermaid'),
    ) => {
      const code = pre.querySelector('code.language-mermaid')
      const source = code?.textContent ?? ''
      const id = `mermaid-${seqRef.current++}`

      // 复用或创建渲染容器（放在代码块之后）
      let box = pre.nextElementSibling as HTMLElement | null
      if (!box || !box.classList.contains('mermaid-render')) {
        box = document.createElement('div')
        box.className = 'mermaid-render'
        pre.after(box)
      }

      try {
        const { svg } = await mm.default.render(id, source)
        box.innerHTML = svg
        const svgEl = box.querySelector('svg')
        if (svgEl) {
          // 融入页面背景：清除 mermaid 主题自带背景色
          svgEl.style.background = 'transparent'
          svgEl.style.maxWidth = '100%'
          svgEl.style.height = 'auto'
        }
        pre.style.display = 'none'
      } catch (err) {
        console.error('[mermaid] render failed:', id, err)
        box.textContent = ''
        pre.style.display = ''
      }
    }

    const renderAll = async () => {
      const mm = await ensureMermaid()
      if (disposed) return

      // 为所有代码块（含 mermaid 源码块）标注语言，用于右上角语言标签
      for (const code of Array.from(
        root.querySelectorAll<HTMLElement>('pre > code'),
      )) {
        const pre = code.closest('pre')
        if (!pre || pre.dataset.lang) continue
        const m = code.className.match(/language-([\w-]+)/)
        if (m) pre.dataset.lang = m[1]
      }

      const pres = Array.from(
        root.querySelectorAll<HTMLPreElement>('pre > code.language-mermaid'),
      ).map((c) => c.closest('pre') as HTMLPreElement)
      for (const pre of pres) {
        await renderBlock(pre, mm)
      }
    }

    void renderAll()

    // 主题切换（html.dark class 变化）时重新渲染所有流程图
    observer = new MutationObserver(() => {
      void renderAll()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      disposed = true
      observer?.disconnect()
    }
  }, [html])

  return (
    <div
      ref={rootRef}
      className="prose prose-y mt-10 max-w-none"
      // 内容来自本站 content/ 目录下自己维护的 Markdown，视为可信输入
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
