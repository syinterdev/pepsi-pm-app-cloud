import {
  announcementItemSchema,
  announcementListResponseSchema,
  type AnnouncementItem,
  type AnnouncementListResponse,
  type CreateAnnouncementBody,
  type PatchAnnouncementBody,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchAnnouncements(): Promise<AnnouncementListResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/announcements')
  return announcementListResponseSchema.parse(json)
}

export async function createAnnouncement(
  body: CreateAnnouncementBody,
): Promise<AnnouncementItem> {
  const json = await fetchApi<unknown>('/api/v1/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return announcementItemSchema.parse(json)
}

export async function patchAnnouncement(
  id: number,
  body: PatchAnnouncementBody,
): Promise<AnnouncementItem> {
  const json = await fetchApi<unknown>(`/api/v1/admin/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return announcementItemSchema.parse(json)
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await fetchApi<unknown>(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' })
}
