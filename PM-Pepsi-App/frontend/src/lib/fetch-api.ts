import { i18n } from '@/i18n'
import { getBoardKioskToken } from '@/lib/board-kiosk'
import { getAuthToken } from '@/features/auth/login-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { AuthApiError } from '@/lib/auth-api-error'
import { MaintenanceModeError } from '@/lib/maintenance-error'

/**
 * เรียก API แบบ same-origin path `/api/...` เมื่อไม่ตั้ง VITE_API_URL
 * (เหมาะกับ reverse proxy ไป backend ใน dev)
 */
export async function fetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const kiosk = getBoardKioskToken()
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(kiosk ? { 'X-Board-Kiosk-Token': kiosk } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (text) {
      try {
        const body = JSON.parse(text) as { error?: string; message?: string }
        if (res.status === 503 && body.error === 'MAINTENANCE') {
          throw new MaintenanceModeError(
            body.message ?? i18n.t('api.maintenanceDefault', { ns: 'common' }),
          )
        }
        if (body.message || body.error) {
          throw new AuthApiError(res.status, body.error, body.message)
        }
      } catch (e) {
        if (e instanceof MaintenanceModeError) throw e
        if (e instanceof AuthApiError) throw e
        if (e instanceof Error && e.message !== text) throw e
      }
    }
    throw new Error(text || `HTTP ${res.status}`)
  }
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error(i18n.t('api.htmlNotJson', { ns: 'common' }))
    }
    throw new Error(text.slice(0, 200) || i18n.t('api.invalidJson', { ns: 'common' }))
  }
}
