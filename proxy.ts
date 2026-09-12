import { NextResponse, type NextRequest } from 'next/server'
import { isLocale, pickLocale, type Locale } from '@/lib/locale'

const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * 语言路由代理（Next.js 16 中 middleware 更名为 proxy）：
 * 无语言前缀的路径 308 重定向到 /zh 或 /en（cookie 优先，其次 Accept-Language）。
 * 站点内所有链接统一使用 /zh/* 与 /en/* 前缀。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const firstSegment = pathname.split('/')[1] ?? ''
  if (isLocale(firstSegment)) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  const locale: Locale =
    cookie && isLocale(cookie) ? cookie : pickLocale(request.headers.get('accept-language'))

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url, 308)
}

export const config = {
  // 排除静态资源、元数据文件（sitemap/robots/feed 等带扩展名，og/twitter-image 以 -image 结尾）
  matcher: ['/((?!api|_next|.*\\..*|.*-image|favicon\\.ico).*)'],
}
