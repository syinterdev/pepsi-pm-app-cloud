import {
  telegramGroupItemSchema,
  telegramGroupListResponseSchema,
  telegramLinkStatusResponseSchema,
  telegramSummaryResponseSchema,
  telegramTestSendResponseSchema,
  type CreateTelegramGroupBody,
  type PatchTelegramGroupBody,
  type TelegramGroupItem,
  type TelegramLinkStatusResponse,
  type TelegramSummaryResponse,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchTelegramSummary(): Promise<TelegramSummaryResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/telegram/summary')
  return telegramSummaryResponseSchema.parse(json)
}

export async function fetchTelegramLinkStatus(): Promise<TelegramLinkStatusResponse> {
  const json = await fetchApi<unknown>('/api/v1/admin/telegram/link-status')
  return telegramLinkStatusResponseSchema.parse(json)
}

export async function fetchTelegramGroups(): Promise<TelegramGroupItem[]> {
  const json = await fetchApi<unknown>('/api/v1/admin/telegram/groups')
  return telegramGroupListResponseSchema.parse(json).items
}

export async function createTelegramGroup(
  body: CreateTelegramGroupBody,
): Promise<TelegramGroupItem> {
  const json = await fetchApi<unknown>('/api/v1/admin/telegram/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return telegramGroupItemSchema.parse(json)
}

export async function patchTelegramGroup(
  id: number,
  body: PatchTelegramGroupBody,
): Promise<TelegramGroupItem> {
  const json = await fetchApi<unknown>(`/api/v1/admin/telegram/groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return telegramGroupItemSchema.parse(json)
}

export async function deleteTelegramGroup(id: number): Promise<void> {
  await fetchApi<unknown>(`/api/v1/admin/telegram/groups/${id}`, { method: 'DELETE' })
}

export async function testTelegramGroup(
  id: number,
  message?: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const json = await fetchApi<unknown>(`/api/v1/admin/telegram/groups/${id}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message ? { message } : {}),
  })
  return telegramTestSendResponseSchema.parse(json)
}
