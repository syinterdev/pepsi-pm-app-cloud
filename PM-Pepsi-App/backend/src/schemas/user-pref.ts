import { z } from 'zod'

export const themeModePrefSchema = z.enum(['light', 'dark', 'system'])
export const densityPrefSchema = z.enum(['comfortable', 'compact'])

export const userPrefSchema = z.object({
  userId: z.string(),
  themeMode: themeModePrefSchema.nullable(),
  language: z.string().nullable(),
  density: densityPrefSchema.nullable(),
  seenTours: z.record(z.string(), z.boolean()),
  updatedAt: z.string(),
})

export type UserPref = z.infer<typeof userPrefSchema>

export const patchUserPrefBodySchema = z.object({
  themeMode: themeModePrefSchema.optional(),
  language: z.string().trim().max(16).optional().nullable(),
  density: densityPrefSchema.optional(),
  seenTours: z.record(z.string(), z.boolean()).optional(),
})

export type PatchUserPrefBody = z.infer<typeof patchUserPrefBodySchema>

export const markTourSeenBodySchema = z.object({
  tourKey: z.string().trim().min(1).max(64),
})
