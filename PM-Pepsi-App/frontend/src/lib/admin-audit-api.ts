import {
  auditDeleteResponseSchema,
  auditListResponseSchema,
  auditMetaResponseSchema,
  type AuditFilters,
  type AuditListResponse,
  type AuditMetaResponse,
} from '@/api/schemas'
import { getAuthToken } from '@/features/auth/login-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { fetchApi } from '@/lib/fetch-api'

const PAGE_SIZE = 50

function buildSearchParams(
  filters: AuditFilters,
  paging?: { limit?: number; offset?: number },
): string {
  const p = new URLSearchParams()
  if (filters.from) p.set('from', filters.from)
  if (filters.to) p.set('to', filters.to)
  if (filters.actorId) p.set('actorId', filters.actorId)
  if (filters.resource) p.set('resource', filters.resource)
  if (filters.status && filters.status !== 'all') p.set('status', filters.status)
  if (filters.q) p.set('q', filters.q)
  if (filters.actionPrefix?.length) {
    for (const prefix of filters.actionPrefix) p.append('actionPrefix', prefix)
  }
  p.set('limit', String(paging?.limit ?? PAGE_SIZE))
  p.set('offset', String(paging?.offset ?? 0))
  return p.toString()
}

export function defaultAuditFilters(): AuditFilters {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    status: 'all',
    actionPrefix: [],
  }
}

export async function fetchAuditLogs(
  filters: AuditFilters,
  offset: number,
): Promise<AuditListResponse> {
  const qs = buildSearchParams(filters, { limit: PAGE_SIZE, offset })
  const json = await fetchApi<unknown>(`/api/v1/admin/audit?${qs}`)
  return auditListResponseSchema.parse(json)
}

export async function fetchAuditMeta(): Promise<AuditMetaResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/audit/meta')
  return auditMetaResponseSchema.parse(json)
}

export async function searchAuditActors(q: string): Promise<string[]> {
  const json = await fetchApi<{ items: string[] }>(
    `/api/v1/admin/audit/actors?q=${encodeURIComponent(q)}`,
  )
  return json.items ?? []
}

export async function downloadAuditCsv(filters: AuditFilters): Promise<void> {
  const qs = buildSearchParams(filters, { limit: 50_000, offset: 0 })
  const base = getApiBaseUrl()
  const path = `/api/v1/admin/audit/export?${qs}`
  const url = base ? `${base}${path}` : path
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const stamp = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `audit-log-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function deleteAuditOlderThan(olderThan: string): Promise<number> {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/audit?olderThan=${encodeURIComponent(olderThan)}`,
    { method: 'DELETE' },
  )
  return auditDeleteResponseSchema.parse(json).deleted
}

export const AUDIT_ACTION_GROUPS = [
  { id: 'auth', label: 'Auth', prefix: 'auth.' },
  { id: 'planning', label: 'Planning', prefix: 'planning.' },
  { id: 'confirmation', label: 'Confirmation', prefix: 'confirmation.' },
  { id: 'master', label: 'Master data', prefix: 'master-data.' },
  { id: 'admin', label: 'Admin', prefix: 'admin.' },
  { id: 'personnel', label: 'Personnel / users', prefix: 'admin.users' },
  { id: 'work', label: 'Work orders', prefix: 'work-orders.' },
  { id: 'iw37n', label: 'IW37N', prefix: 'iw37n.' },
  { id: 'manhours', label: 'Manhours', prefix: 'manhours.' },
  { id: 'scheduling', label: 'Scheduling', prefix: 'scheduling.' },
] as const

export { PAGE_SIZE }
