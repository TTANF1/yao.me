import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'
import { codeToHtml } from 'shiki'
import type { Element, Root } from 'hast'

/**
 * rehype 插件：用 shiki 渲染 Markdown 代码块（pre > code.language-xxx）。
 *
 * - 双主题输出（github-light / github-dark），暗色模式下由 CSS 切换到 --shiki-dark-* 变量；
 * - mermaid 代码块跳过，交由客户端 MermaidRenderer 渲染流程图；
 * - 未知语言等渲染失败时保留原始代码块，不阻塞文章生成；
 * - 为生成的 pre 补充 data-lang，用于右上角语言标签（CSS ::after）。
 */
export function rehypeShiki() {
  return async (tree: Root) => {
    const jobs: { node: Element; parent: Element | Root; index: number; lang: string; code: string }[] = []

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || parent == null || index == null) return
      const first = node.children[0]
      if (!first || first.type !== 'element' || first.tagName !== 'code') return

      const className = first.properties?.className
      const classes = Array.isArray(className) ? className.map(String) : []
      const langMatch = classes.find((c) => c.startsWith('language-'))
      if (!langMatch) return

      const lang = langMatch.slice('language-'.length)
      if (!lang || lang === 'mermaid') return

      const code = collectText(first)
      if (!code.trim()) return

      jobs.push({ node, parent, index, lang, code })
    })

    for (const { node, parent, index, lang, code } of jobs) {
      try {
        const markup = await codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: 'light',
        })
        const parsed = fromHtml(markup, { fragment: true }).children[0]
        if (!parsed || parsed.type !== 'element') continue
        // 语言标签：右上角显示语言名
        parsed.properties = {
          ...(parsed.properties ?? {}),
          dataLang: lang,
        }
        // 若原 pre 上有 class（如 markdown 手写的自定义类），合并保留
        const original = node.properties?.className
        if (original) {
          const base = Array.isArray(original) ? original.map(String) : [String(original)]
          parsed.properties.className = [...base, ...(parsed.properties?.className ?? [])]
        }
        parent.children[index] = parsed
      } catch {
        // 未知语言/渲染失败：保留原始代码块
      }
    }
  }
}

function collectText(node: Element): string {
  let out = ''
  for (const child of node.children) {
    if (child.type === 'text') out += child.value
    else if (child.type === 'element') out += collectText(child)
  }
  return out
}
