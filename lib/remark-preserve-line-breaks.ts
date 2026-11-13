import type { Break, Parent, Root, Text } from 'mdast'

/** 仅转换正文文本中的软换行，代码块与行内代码保持原样。 */
export function remarkPreserveLineBreaks({ enabled }: { enabled: boolean }) {
  return (tree: Root) => {
    if (!enabled) return

    function walk(parent: Parent) {
      parent.children = parent.children.flatMap((node): Parent['children'] => {
        if (node.type === 'text') {
          return node.value.split(/\r?\n/).flatMap((value, index): (Text | Break)[] =>
            index === 0
              ? [{ type: 'text', value }]
              : [{ type: 'break' }, { type: 'text', value }],
          )
        }
        if ('children' in node) walk(node)
        return [node]
      })
    }

    walk(tree)
  }
}
