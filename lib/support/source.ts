import type { PublicSource } from './types'

export function sourceSummary(source: PublicSource) {
  // These paths identify the site's imported public repository snapshots.
  const repository = /^github\/([A-Za-z0-9_.-]+)\.md$/.exec(source.path)?.[1]
  const url = repository && (source.title === `TTANF1/${repository}` || source.title.startsWith(`TTANF1/${repository} — `))
    ? `https://github.com/TTANF1/${encodeURIComponent(repository)}`
    : undefined
  const excerpt = source.excerpt
    .replace(/<[^>]*>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^[\s#>*-]+/gm, '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const projectDescription = /项目描述[：:]\s*([^\r\n]+)/.exec(source.excerpt)?.[1]?.trim()
  const description = (projectDescription || excerpt || source.heading || source.title).slice(0, 100)
  const title = url ? `TTANF1/${repository}` : source.title
  return { url, title, description }
}
