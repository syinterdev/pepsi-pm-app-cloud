export const BOARD_THEME_IDS = ['dark', 'light'] as const
export type BoardThemeId = (typeof BOARD_THEME_IDS)[number]

export const BOARD_THEME_STORAGE_KEY = 'pm_board_theme'

export function isBoardThemeId(v: string): v is BoardThemeId {
  return v === 'dark' || v === 'light'
}

export function readBoardTheme(): BoardThemeId {
  try {
    const raw = sessionStorage.getItem(BOARD_THEME_STORAGE_KEY)
    if (raw && isBoardThemeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function writeBoardTheme(theme: BoardThemeId): void {
  try {
    sessionStorage.setItem(BOARD_THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

/** `?theme=light` | `?theme=dark` */
export function parseBoardThemeFromSearchParams(params: URLSearchParams): BoardThemeId | null {
  const raw = params.get('theme')?.trim().toLowerCase()
  if (raw === 'light') return 'light'
  if (raw === 'dark') return 'dark'
  return null
}

