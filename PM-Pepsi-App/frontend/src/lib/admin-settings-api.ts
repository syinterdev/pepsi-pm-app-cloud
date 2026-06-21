import {
  adminSecretSettingsResponseSchema,
  adminSettingsResponseSchema,
  type AdminSettings,
  type PatchAdminSettingsBody,
  type SettingsResetSection,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const json = await fetchApi<unknown>('/api/v1/admin/settings')
  return adminSettingsResponseSchema.parse(json)
}

export async function patchAdminSettings(body: PatchAdminSettingsBody): Promise<AdminSettings> {
  const json = await fetchApi<unknown>('/api/v1/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return adminSettingsResponseSchema.parse(json)
}

export async function resetAdminSettings(): Promise<AdminSettings> {
  const json = await fetchApi<unknown>('/api/v1/admin/settings/reset', { method: 'POST' })
  return adminSettingsResponseSchema.parse(json)
}

export async function resetAdminSettingsSection(
  section: SettingsResetSection,
): Promise<AdminSettings> {
  const json = await fetchApi<unknown>(`/api/v1/admin/settings/reset/${section}`, {
    method: 'POST',
  })
  return adminSettingsResponseSchema.parse(json)
}

export async function fetchAdminSecretSettings() {
  const json = await fetchApi<unknown>('/api/v1/admin/settings/secrets')
  return adminSecretSettingsResponseSchema.parse(json)
}
