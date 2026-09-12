import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import type { Locale } from './locale'

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return String(value ?? '').trim()
}


export interface PostMeta {
  slug: string
  title: string
  /** ISO 日期字符串，格式 YYYY-MM-DD */
  date: string
  summary: string
  tags: string[]
  draft?: boolean
}

export interface Post extends PostMeta {
  contentHtml: string
  /** 粗略阅读时长（分钟） */
  readingMinutes: number
}

/**
 * 内容管线：从 content/posts/<locale>/ 下的 Markdown 文件构建文章。
 * 添加文章 = 在对应语言目录放一个 .md 文件即可，frontmatter 约定：
 *   title / date / summary / tags / draft
 * 之后可扩展为从 Obsidian 知识库（D:\obsidian\YaosKnowledge）同步。
 */
const contentRoot = path.join(process.cwd(), 'content', 'posts')

function postsDir(locale: Locale) {
  return path.join(contentRoot, locale)
}

export function getPostSlugs(locale: Locale): string[] {
  const dir = postsDir(locale)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx?$/, ''))
}

export function getAllPosts(locale: Locale): PostMeta[] {
  const dir = postsDir(locale)
  if (!fs.existsSync(dir)) return []
  return getPostSlugs(locale)
    .map((slug) => {
      const file = fs
        .readdirSync(dir)
        .find((f) => f.replace(/\.mdx?$/, '') === slug)!
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const { data } = matter(raw)
      return {
        slug,
        title: String(data.title ?? slug),
        date: normalizeDate(data.date),
        summary: String(data.summary ?? ''),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        draft: Boolean(data.draft),
      } satisfies PostMeta
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPost(locale: Locale, slug: string): Promise<Post | null> {
  const dir = postsDir(locale)
  const mdPath = path.join(dir, `${slug}.md`)
  const mdxPath = path.join(dir, `${slug}.mdx`)
  const filePath = fs.existsSync(mdPath) ? mdPath : fs.existsSync(mdxPath) ? mdxPath : null
  if (!filePath) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  if (data.draft) return null

  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content)

  return {
    slug,
    title: String(data.title ?? slug),
    date: normalizeDate(data.date),
    summary: String(data.summary ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    contentHtml: String(html),
    readingMinutes: Math.max(1, Math.round(content.length / 500)),
  }
}
