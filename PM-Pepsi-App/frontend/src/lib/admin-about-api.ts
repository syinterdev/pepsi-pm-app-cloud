import { adminAboutResponseSchema, type AdminAboutResponse } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchAdminAbout(): Promise<AdminAboutResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/about')
  return adminAboutResponseSchema.parse(json)
}
