import { z } from 'zod'

export const telegramLinkTokenResponseSchema = z.object({
  token: z.string(),
  deepLink: z.string(),
  expiresAt: z.string(),
  botUsername: z.string().nullable(),
  wkctr: z.string(),
  idwkctr: z.string(),
})

export type TelegramLinkTokenResponse = z.infer<typeof telegramLinkTokenResponseSchema>

export const telegramLinkStatusSchema = z.object({
  linked: z.boolean(),
  wkctr: z.string().optional(),
  idwkctr: z.string().optional(),
  telegramChatId: z.string().nullable(),
  telegramUsername: z.string().nullable(),
  telegramLinkedAt: z.string().nullable(),
  botConfigured: z.boolean(),
  botUsername: z.string().nullable(),
})

export type TelegramLinkStatus = z.infer<typeof telegramLinkStatusSchema>

export const telegramUnlinkResponseSchema = z.object({
  ok: z.literal(true),
  idwkctr: z.string(),
})

export const telegramWebhookOkSchema = z.object({
  ok: z.literal(true),
})
