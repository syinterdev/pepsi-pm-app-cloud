import {
  parseBoardThemeFromSearchParams,
  readBoardTheme,
  writeBoardTheme,
  type BoardThemeId,
} from '@/lib/board-theme'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** ธีม kiosk: มืด (default) หรือสว่าง */
export function useBoardTheme() {
  const [searchParams] = useSearchParams()
  const [theme, setThemeState] = useState<BoardThemeId>(() => readBoardTheme())

  useEffect(() => {
    const fromUrl = parseBoardThemeFromSearchParams(searchParams)
    if (fromUrl != null) {
      setThemeState(fromUrl)
      writeBoardTheme(fromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    document.documentElement.classList.toggle('board-kiosk-root--light', theme === 'light')
    return () => document.documentElement.classList.remove('board-kiosk-root--light')
  }, [theme])

  const setTheme = useCallback((next: BoardThemeId) => {
    setThemeState(next)
    writeBoardTheme(next)
  }, [])

  return {
    theme,
    setTheme,
    kioskDark: theme === 'dark',
    themeClass: `engineering-board--theme-${theme}` as const,
  }
}
