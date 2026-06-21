import { z } from 'zod'

export const announcementLevelSchema = z.enum(['info', 'warn', 'error', 'maintenance'])

export const announcementItemSchema = z.object({
  id: z.number(),
  level: announcementLevelSchema,
  title: z.string(),
  body: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  dismissable: z.boolean(),
  active: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})

export type AnnouncementItem = z.infer<typeof announcementItemSchema>

export const announcementListResponseSchema = z.object({
  items: z.array(announcementItemSchema),
})

export const activeAnnouncementsResponseSchema = z.object({
  items: z.array(
    announcementItemSchema.pick({
      id: true,
      level: true,
      title: true,
      body: true,
      startsAt: true,
      endsAt: true,
      dismissable: true,
    }),
  ),
})

export const createAnnouncementBodySchema = z.object({
  level: announcementLevelSchema.optional().default('info'),
  title: z.string().trim().min(1).max(500),
  body: z.string().max(10000).optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
  dismissable: z.boolean().optional().default(true),
  active: z.boolean().optional().default(true),
})

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBodySchema>

export const patchAnnouncementBodySchema = createAnnouncementBodySchema.partial()

export type PatchAnnouncementBody = z.infer<typeof patchAnnouncementBodySchema>

export const announcementDeleteResponseSchema = z.object({
  ok: z.literal(true),
  id: z.number(),
})
