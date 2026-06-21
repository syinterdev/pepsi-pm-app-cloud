import { publicSettingsResponseSchema } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { getApiBaseUrl } from '@/lib/api-client'

export async function fetchPublicSettings() {
  const json = await fetchApi<unknown>('/api/v1/settings/public')
  return publicSettingsResponseSchema.parse(json)
}

function withBrandingCache(url: string, cacheKey?: number | string): string {
  if (cacheKey === undefined || cacheKey === '') return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${encodeURIComponent(String(cacheKey))}`
}

export function publicLogoUrl(cacheKey?: number | string): string {
  const base = getApiBaseUrl()
  const path = '/api/v1/settings/public/logo'
  const url = base ? `${base}${path}` : path
  return withBrandingCache(url, cacheKey)
}

export function publicFaviconUrl(): string {
  const base = getApiBaseUrl()
  const path = '/api/v1/settings/public/favicon'
  return base ? `${base}${path}` : path
}

export function publicLoginBackgroundUrl(cacheKey?: number | string): string {
  const base = getApiBaseUrl()
  const path = '/api/v1/settings/public/login-background'
  const url = base ? `${base}${path}` : path
  return withBrandingCache(url, cacheKey)
}
