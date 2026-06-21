import { z } from 'zod'
import { auditStatusSchema } from './audit-log.js'

export const auditListQuerySchema = z.object({
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  actorId: z.string().trim().max(64).optional(),
  action: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined
      const arr = Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)
      return arr.length > 0 ? arr : undefined
    }),
  actionPrefix: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined
      const arr = Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)
      return arr.length > 0 ? arr : undefined
    }),
  resource: z.string().trim().max(64).optional(),
  status: z.union([auditStatusSchema, z.literal('all')]).optional().default('all'),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AuditListQuery = z.infer<typeof auditListQuerySchema>

export const auditLogItemSchema = z.object({
  id: z.number(),
  actorId: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  status: auditStatusSchema,
  message: z.string().nullable(),
  createdAt: z.string(),
})

export type AuditLogItem = z.infer<typeof auditLogItemSchema>

export const auditListResponseSchema = z.object({
  items: z.array(auditLogItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export type AuditListResponse = z.infer<typeof auditListResponseSchema>

export const auditMetaResponseSchema = z.object({
  actions: z.array(z.string()),
  actors: z.array(z.object({ actorId: z.string(), count: z.number().int() })),
  retentionDays: z.number().int(),
  retentionCutoffDate: z.string(),
})

export type AuditMetaResponse = z.infer<typeof auditMetaResponseSchema>

export const auditDeleteQuerySchema = z.object({
  olderThan: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'olderThan must be YYYY-MM-DD'),
})

export const auditDeleteResponseSchema = z.object({
  ok: z.literal(true),
  deleted: z.number().int(),
})
