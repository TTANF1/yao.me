'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/locale'

/**
 * 语言切换：把当前路径的语言前缀换成另一种语言，并写入 NEXT_LOCALE cookie
 * 供下次访问（proxy）优先识别。
 */
export function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname()
  const other: Locale = current === 'zh' ? 'en' : 'zh'
  const rest = pathname.replace(/^\/(zh|en)/, '')
  const href = `/${other}${rest}`

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={() => {
        document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000; samesite=lax`
      }}
      className="inline-flex h-8 items-center rounded-md px-2 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {other === 'zh' ? '中文' : 'EN'}
    </Link>
  )
}
