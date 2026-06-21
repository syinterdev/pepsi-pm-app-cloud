import { z } from 'zod'

export const boardKioskStatusSchema = z.object({
  enabled: z.boolean(),
  tokenRequired: z.boolean(),
})

export const boardKioskAdminSchema = z.object({
  enabled: z.boolean(),
  hasToken: z.boolean(),
})

export const boardKioskRotateResponseSchema = z.object({
  token: z.string().min(16),
  enabled: z.boolean(),
  boardPath: z.literal('/board'),
})

export const patchBoardKioskBodySchema = z.object({
  enabled: z.boolean(),
})
