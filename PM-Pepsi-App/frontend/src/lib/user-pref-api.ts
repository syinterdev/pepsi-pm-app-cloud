import {
  patchUserPrefBodySchema,
  userPrefSchema,
  type PatchUserPrefBody,
  type UserPref,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchUserPreferences(): Promise<UserPref> {
  const json = await fetchApi<unknown>('/api/v1/user/preferences')
  return userPrefSchema.parse(json)
}

export async function patchUserPreferences(body: PatchUserPrefBody): Promise<UserPref> {
  const json = await fetchApi<unknown>('/api/v1/user/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchUserPrefBodySchema.parse(body)),
  })
  return userPrefSchema.parse(json)
}

export async function markTourSeenOnServer(tourKey: string): Promise<UserPref> {
  const json = await fetchApi<unknown>('/api/v1/user/preferences/tour-seen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tourKey }),
  })
  return userPrefSchema.parse(json)
}
