import { locales } from '@/lib/locale'
import { getAllPosts } from '@/lib/posts'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const items = locales
    .flatMap((locale) =>
      getAllPosts(locale).map((post) => ({
        ...post,
        url: `${site.url}/${locale}/blog/${post.slug}`,
      })),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(site.name)}</title>
<link>${site.url}/</link>
<description>${escapeXml(`${site.name} - home / animation / frontend`)}</description>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items
  .map(
    (item) => `<item>
<title>${escapeXml(item.title)}</title>
<link>${item.url}</link>
<guid>${item.url}</guid>
<pubDate>${new Date(`${item.date}T00:00:00Z`).toUTCString()}</pubDate>
<description>${escapeXml(item.summary)}</description>
</item>`,
  )
  .join('')}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
