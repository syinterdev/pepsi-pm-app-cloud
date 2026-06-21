const STORAGE_KEY = 'pm_board_kiosk_token'

let activeToken: string | null = null

export function getBoardKioskToken(): string | null {
  return activeToken
}

export function setBoardKioskToken(token: string | null): void {
  activeToken = token?.trim() || null
  if (activeToken) {
    try {
      sessionStorage.setItem(STORAGE_KEY, activeToken)
    } catch {
      /* ignore */
    }
  } else {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export function loadBoardKioskTokenFromStorage(): string | null {
  try {
    const t = sessionStorage.getItem(STORAGE_KEY)?.trim()
    if (t) {
      activeToken = t
      return t
    }
  } catch {
    /* ignore */
  }
  return null
}

/** อ่าน token จาก URL แล้วเก็บ — คืนค่า token ที่ใช้งาน */
export function applyBoardKioskFromSearchParams(params: URLSearchParams): string | null {
  const fromUrl = params.get('token')?.trim() || params.get('kiosk_token')?.trim()
  if (fromUrl) {
    setBoardKioskToken(fromUrl)
    return fromUrl
  }
  return loadBoardKioskTokenFromStorage()
}

export function buildBoardUrl(origin: string, token?: string | null): string {
  const base = `${origin.replace(/\/$/, '')}/board`
  if (!token?.trim()) return base
  return `${base}?token=${encodeURIComponent(token.trim())}`
}
