import { z } from 'zod'

export const telegramNotifyKindSchema = z.enum([
  'assignment_to_tech',
  'ack_to_planner',
  'close_to_planner',
  'ack_summary',
  'confirm_reminder',
  'custom',
])

export const telegramLinkTypeSchema = z.enum(['none', 'wkctrgroup', 'pm_team', 'workcenters'])

export const telegramGroupItemSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1).max(32),
  name: z.string().min(1),
  notifyKind: telegramNotifyKindSchema,
  linkType: telegramLinkTypeSchema,
  linkRef: z.string().max(64).nullable(),
  telegramChatId: z.string().nullable(),
  enabled: z.boolean(),
  note: z.string().nullable(),
  memberWkctrs: z.array(z.string().min(1)).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TelegramGroupItem = z.infer<typeof telegramGroupItemSchema>

export const telegramGroupListResponseSchema = z.object({
  items: z.array(telegramGroupItemSchema),
})

export const createTelegramGroupBodySchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1),
  notifyKind: telegramNotifyKindSchema,
  linkType: telegramLinkTypeSchema.default('none'),
  linkRef: z.string().trim().max(64).nullable().optional(),
  telegramChatId: z.union([z.string(), z.number()]).nullable().optional(),
  enabled: z.boolean().optional(),
  note: z.string().trim().nullable().optional(),
  memberWkctrs: z.array(z.string().trim().min(1)).optional(),
})

export type CreateTelegramGroupBody = z.infer<typeof createTelegramGroupBodySchema>

export const patchTelegramGroupBodySchema = createTelegramGroupBodySchema
  .partial()
  .extend({
    code: z.string().trim().min(1).max(32).optional(),
    name: z.string().trim().min(1).optional(),
    notifyKind: telegramNotifyKindSchema.optional(),
    linkType: telegramLinkTypeSchema.optional(),
  })

export type PatchTelegramGroupBody = z.infer<typeof patchTelegramGroupBodySchema>

export const telegramGroupDeleteResponseSchema = z.object({
  ok: z.literal(true),
  id: z.number().int().positive(),
})

export const telegramSummaryResponseSchema = z.object({
  botConfigured: z.boolean(),
  notifyEnabled: z.boolean(),
  totalGroups: z.number().int().nonnegative(),
  enabledGroups: z.number().int().nonnegative(),
  linkedTechnicians: z.number().int().nonnegative(),
  activeTechnicians: z.number().int().nonnegative(),
  wkctrGroups: z.array(
    z.object({
      code: z.string(),
      description: z.string().nullable(),
    }),
  ),
  pmTeams: z.array(z.string()),
})

export type TelegramSummaryResponse = z.infer<typeof telegramSummaryResponseSchema>

export const telegramLinkStatusResponseSchema = z.object({
  linked: z.number().int().nonnegative(),
  unlinked: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      wkctr: z.string(),
      displayName: z.string().nullable(),
      telegramChatId: z.string().nullable(),
      telegramUsername: z.string().nullable(),
      telegramLinkedAt: z.string().nullable(),
    }),
  ),
})

export type TelegramLinkStatusResponse = z.infer<typeof telegramLinkStatusResponseSchema>

export const telegramTestSendBodySchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
})

export const telegramTestSendResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
})
