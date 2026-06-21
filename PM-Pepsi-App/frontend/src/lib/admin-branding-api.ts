import {
  adminBrandingResponseSchema,
  type AdminBranding,
  type PatchAdminBrandingBody,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchAdminBranding(): Promise<AdminBranding> {
  const json = await fetchApi<unknown>('/api/v1/admin/branding')
  return adminBrandingResponseSchema.parse(json)
}

export async function patchAdminBranding(body: PatchAdminBrandingBody): Promise<AdminBranding> {
  const json = await fetchApi<unknown>('/api/v1/admin/branding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return adminBrandingResponseSchema.parse(json)
}

export async function resetAdminBranding(): Promise<AdminBranding> {
  const json = await fetchApi<unknown>('/api/v1/admin/branding/reset', { method: 'POST' })
  return adminBrandingResponseSchema.parse(json)
}

export type BrandingUploadOptions = {
  removeBackground?: boolean
}

export async function uploadAdminBrandingLogo(file: File, options?: BrandingUploadOptions) {
  const fd = new FormData()
  fd.append('file', file)
  if (options?.removeBackground) fd.append('removeBackground', '1')
  return fetchApi<unknown>('/api/v1/admin/branding/logo', { method: 'POST', body: fd })
}

export async function deleteAdminBrandingLogo() {
  return fetchApi<unknown>('/api/v1/admin/branding/logo', { method: 'DELETE' })
}

export async function uploadAdminBrandingFavicon(file: File, options?: BrandingUploadOptions) {
  const fd = new FormData()
  fd.append('file', file)
  if (options?.removeBackground) fd.append('removeBackground', '1')
  return fetchApi<unknown>('/api/v1/admin/branding/favicon', { method: 'POST', body: fd })
}

export async function deleteAdminBrandingFavicon() {
  return fetchApi<unknown>('/api/v1/admin/branding/favicon', { method: 'DELETE' })
}

export async function uploadAdminBrandingLoginBackground(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return fetchApi<unknown>('/api/v1/admin/branding/login-background', { method: 'POST', body: fd })
}

export async function deleteAdminBrandingLoginBackground() {
  return fetchApi<unknown>('/api/v1/admin/branding/login-background', { method: 'DELETE' })
}
