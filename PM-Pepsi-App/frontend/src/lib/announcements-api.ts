import { activeAnnouncementsResponseSchema } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchActiveAnnouncements() {
  const json = await fetchApi<unknown>('/api/v1/announcements/active')
  return activeAnnouncementsResponseSchema.parse(json)
}
