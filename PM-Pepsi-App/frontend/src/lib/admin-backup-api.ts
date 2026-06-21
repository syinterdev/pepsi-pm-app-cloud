import {
  backupListResponseSchema,
  backupScheduleResponseSchema,
  restoreBackupResponseSchema,
  startBackupResponseSchema,
  type BackupListResponse,
  type BackupScheduleResponse,
  type PatchBackupScheduleBody,
  type RestoreBackupResponse,
} from '@/api/schemas'
import { getAuthToken } from '@/features/auth/login-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { fetchApi } from '@/lib/fetch-api'

export function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export async function fetchBackupList(
  offset = 0,
  limit = 50,
): Promise<BackupListResponse> {
  const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  const json = await fetchApi<unknown>(`/api/v1/admin/backup?${qs}`)
  return backupListResponseSchema.parse(json)
}

export async function fetchBackupSchedule(): Promise<BackupScheduleResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/backup/schedule')
  return backupScheduleResponseSchema.parse(json)
}

export async function patchBackupSchedule(
  body: PatchBackupScheduleBody,
): Promise<BackupScheduleResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/backup/schedule', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return backupScheduleResponseSchema.parse(json)
}

export async function startBackupNow() {
  const json = await fetchApi<unknown>('/api/v1/admin/backup', { method: 'POST' })
  return startBackupResponseSchema.parse(json)
}

export async function deleteBackup(id: number): Promise<void> {
  await fetchApi<unknown>(`/api/v1/admin/backup/${id}`, { method: 'DELETE' })
}

export async function restoreBackupFromHistory(id: number): Promise<RestoreBackupResponse> {
  const json = await fetchApi<unknown>(`/api/v1/admin/backup/${id}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmPhrase: 'RESTORE' }),
  })
  return restoreBackupResponseSchema.parse(json)
}

export async function restoreBackupUpload(file: File): Promise<RestoreBackupResponse> {
  const token = getAuthToken()
  const form = new FormData()
  form.append('file', file)
  form.append('confirmPhrase', 'RESTORE')
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/backup/restore`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: form,
  })
  const json: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'message' in json
        ? String((json as { message: unknown }).message)
        : `Restore failed (${res.status})`
    throw new Error(msg)
  }
  return restoreBackupResponseSchema.parse(json)
}

export async function downloadBackup(id: number, fileName: string): Promise<void> {
  const token = getAuthToken()
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/backup/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
