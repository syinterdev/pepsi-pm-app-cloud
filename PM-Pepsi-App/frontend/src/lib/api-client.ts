/** Base URL ของ API — ตั้งใน `.env` เป็น `VITE_API_URL` (ไม่มี trailing slash) */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL
  if (raw === undefined || raw === '') return ''
  return String(raw).replace(/\/$/, '')
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}
