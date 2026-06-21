import { getApiBaseUrl } from '@/lib/api-client'
import { getBoardKioskToken } from '@/lib/board-kiosk'

/**
 * URL รูปประจำตัวช่างบน Engineering Board (WebP จาก `tbworkcenter.imgmember_data`)
 *
 * Kiosk/TV ใช้ route นี้แทน `GET /api/v1/personnel/:id/image` (session/Bearer เท่านั้น)
 * เพราะ `<img>` ส่งได้แค่ cookie หรือ `?kiosk_token=` — ดู `board-kiosk.ts`
 */
export function boardPersonnelAvatarUrl(idwkctr: string): string {
  const params = new URLSearchParams()
  const kiosk = getBoardKioskToken()
  if (kiosk) params.set('kiosk_token', kiosk)
  const qs = params.toString()
  const path = `/api/v1/board/personnel/${encodeURIComponent(idwkctr)}/avatar${qs ? `?${qs}` : ''}`
  const base = getApiBaseUrl()
  return base ? `${base}${path}` : path
}
