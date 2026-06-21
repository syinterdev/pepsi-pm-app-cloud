export const BOARD_CAROUSEL_SLIDES = ['a', 'b', 'c'] as const
export type BoardCarouselSlide = (typeof BOARD_CAROUSEL_SLIDES)[number]

export const BOARD_CAROUSEL_INTERVAL_MS = 45_000
export const BOARD_CAROUSEL_STORAGE_KEY = 'pm_board_carousel'

export function isBoardCarouselSlide(v: string): v is BoardCarouselSlide {
  return v === 'a' || v === 'b' || v === 'c'
}

export function nextBoardCarouselSlide(current: BoardCarouselSlide): BoardCarouselSlide {
  const i = BOARD_CAROUSEL_SLIDES.indexOf(current)
  return BOARD_CAROUSEL_SLIDES[(i + 1) % BOARD_CAROUSEL_SLIDES.length]!
}

export function readBoardCarouselEnabled(): boolean {
  try {
    return sessionStorage.getItem(BOARD_CAROUSEL_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeBoardCarouselEnabled(enabled: boolean): void {
  try {
    if (enabled) sessionStorage.setItem(BOARD_CAROUSEL_STORAGE_KEY, '1')
    else sessionStorage.removeItem(BOARD_CAROUSEL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** `?carousel=1` เปิดโหมดสไลด์ · `?carousel=0` ปิด */
export function parseBoardCarouselFromSearchParams(params: URLSearchParams): boolean | null {
  const raw = params.get('carousel')?.trim().toLowerCase()
  if (raw === '1' || raw === 'true' || raw === 'on') return true
  if (raw === '0' || raw === 'false' || raw === 'off') return false
  return null
}
