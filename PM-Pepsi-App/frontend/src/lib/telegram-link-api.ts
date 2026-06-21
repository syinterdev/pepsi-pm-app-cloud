import {
  telegramLinkStatusSchema,
  telegramLinkTokenResponseSchema,
  type TelegramLinkStatus,
  type TelegramLinkTokenResponse,
} from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'

export async function fetchMyTelegramLinkStatus(): Promise<TelegramLinkStatus> {
  const json = await fetchApi<unknown>('/api/v1/personnel/me/telegram')
  return telegramLinkStatusSchema.parse(json)
}

export async function createMyTelegramLinkToken(): Promise<TelegramLinkTokenResponse> {
  const json = await fetchApi<unknown>('/api/v1/personnel/me/telegram/link', { method: 'POST' })
  return telegramLinkTokenResponseSchema.parse(json)
}

export async function unlinkMyTelegram(): Promise<void> {
  await fetchApi<unknown>('/api/v1/personnel/me/telegram/link', { method: 'DELETE' })
}

export async function createAdminTelegramLinkToken(
  idwkctr: string,
): Promise<TelegramLinkTokenResponse> {
  const json = await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(idwkctr)}/telegram/link?accountType=workcenter`,
    { method: 'POST' },
  )
  return telegramLinkTokenResponseSchema.parse(json)
}

export async function unlinkAdminTelegram(idwkctr: string): Promise<void> {
  await fetchApi<unknown>(
    `/api/v1/admin/users/${encodeURIComponent(idwkctr)}/telegram/link?accountType=workcenter`,
    { method: 'DELETE' },
  )
}
