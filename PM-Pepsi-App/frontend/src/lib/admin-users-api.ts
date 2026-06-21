import {
  adminBulkUserroleResponseSchema,
  adminDeactivateWithoutPhotoResponseSchema,
  adminImpersonateResponseSchema,
  adminLockResponseSchema,
  adminMembersListResponseSchema,
  adminPhotoGoLiveResponseSchema,
  adminResetPasswordResponseSchema,
  personnelAdminListResponseSchema,
  type AdminMemberItem,
  type PersonnelRole,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export type AdminUsersListParams = {
  q?: string
  status?: string
  userrole?: PersonnelRole
  limit?: number
  offset?: number
}

export async function fetchAdminUsersList(params: AdminUsersListParams = {}) {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.status) p.set('status', params.status)
  if (params.userrole) p.set('userrole', params.userrole)
  if (params.limit != null) p.set('limit', String(params.limit))
  if (params.offset != null) p.set('offset', String(params.offset))
  const qs = p.toString()
  const json = await fetchApi<unknown>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`)
  return personnelAdminListResponseSchema.parse(json)
}

export async function fetchAdminMembersList(): Promise<AdminMemberItem[]> {
  const json = await fetchApi<unknown>('/api/v1/admin/users/members')
  return adminMembersListResponseSchema.parse(json).items
}

export async function resetAdminUserPassword(
  id: string,
  accountType: 'workcenter' | 'member' = 'workcenter',
) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/reset-password?accountType=${accountType}`,
    { method: 'POST' },
  )
  return adminResetPasswordResponseSchema.parse(json)
}

export async function lockAdminUser(
  id: string,
  accountType: 'workcenter' | 'member' = 'workcenter',
) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/lock?accountType=${accountType}`,
    { method: 'POST' },
  )
  return adminLockResponseSchema.parse(json)
}

export async function unlockAdminUser(
  id: string,
  accountType: 'workcenter' | 'member' = 'workcenter',
) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/unlock?accountType=${accountType}`,
    { method: 'POST' },
  )
  return adminLockResponseSchema.parse(json)
}

export type AdminPhotoGoLiveParams = {
  from?: string
  to?: string
  weeksBack?: number
}

export async function fetchAdminPhotoGoLiveGaps(params: AdminPhotoGoLiveParams = {}) {
  const p = new URLSearchParams()
  if (params.from) p.set('from', params.from)
  if (params.to) p.set('to', params.to)
  if (params.weeksBack != null) p.set('weeksBack', String(params.weeksBack))
  const qs = p.toString()
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/photo-go-live${qs ? `?${qs}` : ''}`,
  )
  return adminPhotoGoLiveResponseSchema.parse(json)
}

export async function deactivateAdminWithoutPhoto(idwkctrs: string[], workstatus?: string) {
  const json = await fetchApi<unknown>('/api/v1/admin/users/deactivate-without-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idwkctrs, workstatus }),
  })
  return adminDeactivateWithoutPhotoResponseSchema.parse(json)
}

export async function bulkAdminUserrole(idwkctrs: string[], userrole: PersonnelRole) {
  const json = await fetchApi<unknown>('/api/v1/admin/users/bulk-userrole', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idwkctrs, userrole }),
  })
  return adminBulkUserroleResponseSchema.parse(json)
}

export async function impersonateAdminUser(
  id: string,
  accountType: 'workcenter' | 'member' = 'workcenter',
) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/impersonate?accountType=${accountType}`,
    { method: 'POST' },
  )
  return adminImpersonateResponseSchema.parse(json)
}
