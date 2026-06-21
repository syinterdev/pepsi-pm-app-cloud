import {
  adminHealthResponseSchema,
  healthErrorLogResponseSchema,
  healthMigrateResultSchema,
  healthSlowApiResponseSchema,
  type AdminHealthResponse,
  type HealthErrorLogItem,
  type HealthMigrateResult,
  type SlowApiMetric,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchAdminHealth(diskPath?: string): Promise<AdminHealthResponse> {
  const qs = diskPath ? `?diskPath=${encodeURIComponent(diskPath)}` : ''
  const json = await fetchApi<unknown>(`/api/v1/admin/health${qs}`)
  return adminHealthResponseSchema.parse(json)
}

export async function fetchHealthErrorLogs(limit = 100): Promise<HealthErrorLogItem[]> {
  const json = await fetchApi<unknown>(`/api/v1/admin/health/errors?limit=${limit}`)
  return healthErrorLogResponseSchema.parse(json).items
}

export async function fetchHealthSlowApis(thresholdMs = 1000): Promise<{
  thresholdMs: number
  items: SlowApiMetric[]
}> {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/health/slow-apis?thresholdMs=${thresholdMs}&limit=20`,
  )
  return healthSlowApiResponseSchema.parse(json)
}

export async function runHealthMigrate(): Promise<HealthMigrateResult> {
  const json = await fetchApi<unknown>('/api/v1/admin/health/migrate', { method: 'POST' })
  return healthMigrateResultSchema.parse(json)
}

export function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatUptime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}ชม. ${m}น.`
  if (m > 0) return `${m}น. ${s}วิ.`
  return `${s}วิ.`
}

export const HEALTH_POLL_MS = 10_000
