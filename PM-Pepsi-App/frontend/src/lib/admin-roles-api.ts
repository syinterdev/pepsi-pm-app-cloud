import {
  adminRoleMatrixResponseSchema,
  adminRoleSchema,
  adminRolesListResponseSchema,
  createAdminRoleBodySchema,
  roleOkSchema,
  simulateRoleResponseSchema,
  updateAdminRoleBodySchema,
  type AdminRole,
  type AdminRoleMatrixResponse,
  type CreateAdminRoleBody,
  type UpdateAdminRoleBody,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { z } from 'zod'

export async function fetchAdminRolesMatrix(): Promise<AdminRoleMatrixResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/roles/matrix')
  return adminRoleMatrixResponseSchema.parse(json)
}

export async function fetchAdminRolesList(): Promise<AdminRole[]> {
  const json = await fetchApi<unknown>('/api/v1/admin/roles')
  return adminRolesListResponseSchema.parse(json).items
}

export async function simulateAdminRole(roleCode: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/roles/${encodeURIComponent(roleCode)}/simulate`,
  )
  return simulateRoleResponseSchema.parse(json)
}

export async function createAdminRole(body: CreateAdminRoleBody) {
  const payload = createAdminRoleBodySchema.parse(body)
  const json = await fetchApi<unknown>('/api/v1/admin/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return adminRoleSchema.parse(json)
}

export async function updateAdminRole(roleCode: string, body: UpdateAdminRoleBody) {
  const payload = updateAdminRoleBodySchema.parse(body)
  const json = await fetchApi<unknown>(
    `/api/v1/admin/roles/${encodeURIComponent(roleCode)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return adminRoleSchema.parse(json)
}

export async function deleteAdminRole(roleCode: string) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/roles/${encodeURIComponent(roleCode)}`,
    { method: 'DELETE' },
  )
  return roleOkSchema.parse(json)
}

export async function setAdminRolePermissions(
  roleCode: string,
  grants: Record<string, boolean>,
) {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/roles/${encodeURIComponent(roleCode)}/permissions`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grants }),
    },
  )
  return z.object({ ok: z.literal(true), updated: z.number().int() }).parse(json)
}
