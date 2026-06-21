import {
  adminMenuListResponseSchema,
  adminMenuRowSchema,
  createAdminMenuBodySchema,
  menuOkSchema,
  navShellModeSchema,
  updateAdminMenuBodySchema,
  type AdminMenuRow,
  type CreateAdminMenuBody,
  type NavShellMode,
  type UpdateAdminMenuBody,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { z } from 'zod'

export async function fetchNavLayout(): Promise<{ navShellMode: NavShellMode }> {
  const json = await fetchApi<unknown>('/api/v1/admin/menu/layout')
  return z.object({ navShellMode: navShellModeSchema }).parse(json)
}

export async function patchNavLayout(navShellMode: NavShellMode) {
  const json = await fetchApi<unknown>('/api/v1/admin/menu/layout', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ navShellMode }),
  })
  return z.object({ navShellMode: navShellModeSchema }).parse(json)
}

export async function fetchAdminMenuList(): Promise<AdminMenuRow[]> {
  const json = await fetchApi<unknown>('/api/v1/admin/menu')
  return adminMenuListResponseSchema.parse(json).items
}

export async function createAdminMenuItem(body: CreateAdminMenuBody) {
  const payload = createAdminMenuBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/admin/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return adminMenuRowSchema.parse(json)
}

export async function updateAdminMenuItem(idmenu: number, body: UpdateAdminMenuBody) {
  const payload = updateAdminMenuBodySchema.parse(body)
  const json = await fetchApi<unknown>(`/api/v1/admin/menu/${idmenu}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return adminMenuRowSchema.parse(json)
}

export async function deleteAdminMenuItem(idmenu: number) {
  const json = await fetchApi<unknown>(`/api/v1/admin/menu/${idmenu}`, { method: 'DELETE' })
  return menuOkSchema.parse(json)
}

export async function reorderAdminMenu(items: { idmenu: number; menuon: number }[]) {
  const json = await fetchApi<unknown>('/api/v1/admin/menu/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  return menuOkSchema.parse(json)
}

export function assignMenuonOrder(rows: AdminMenuRow[]): { idmenu: number; menuon: number }[] {
  return rows.map((row, idx) => ({ idmenu: row.idmenu, menuon: (idx + 1) * 10 }))
}

export async function syncAdminMenuFromPhp() {
  const json = await fetchApi<unknown>('/api/v1/admin/menu/sync-from-php', { method: 'POST' })
  return z
    .object({
      ok: z.literal(true),
      source: z.string(),
      statements: z.number().int(),
    })
    .parse(json)
}
