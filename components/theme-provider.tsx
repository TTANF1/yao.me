'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggle: () => void
  /** 同步应用主题到 DOM 并更新状态（供切换动效在圆覆盖全屏的瞬间调用，避免异步提交闪烁） */
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
})

/**
 * 主题状态管理：<html> 上的 .dark 类由首帧内联脚本先行设置（见 [locale]/layout.tsx），
 * 避免闪烁；这里负责把用户切换同步到 DOM 并持久化。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // 将主题状态同步到 <html>（驱动 Tailwind dark 变体）与 localStorage
  const applyTheme = useCallback((t: Theme) => {
    const el = document.documentElement
    el.classList.toggle('dark', t === 'dark')
    el.style.colorScheme = t
    try {
      localStorage.setItem('theme', t)
    } catch {
      // 隐私模式等场景下 localStorage 可能不可用，忽略
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  // 同步应用 DOM + 更新状态：主题切换动效在圆覆盖全屏的瞬间调用，
  // 保证"翻转主题 → 隐藏遮罩"在同一帧完成，不产生闪烁
  const setTheme = useCallback(
    (t: Theme) => {
      applyTheme(t)
      setThemeState(t)
    },
    [applyTheme],
  )

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider
      value={{ theme, toggle, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
