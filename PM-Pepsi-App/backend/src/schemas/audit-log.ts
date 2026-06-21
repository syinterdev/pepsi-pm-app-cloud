import { z } from 'zod'

export const auditStatusSchema = z.enum(['ok', 'denied', 'error'])

export type AuditStatus = z.infer<typeof auditStatusSchema>

export const auditActorSchema = z.object({
  actorId: z.string().nullable().optional(),
  actorRole: z.string().max(16).nullable().optional(),
})

export type AuditActor = z.infer<typeof auditActorSchema>

export const auditLogInputSchema = z.object({
  action: z.string().min(1).max(64),
  resource: z.string().max(64).nullable().optional(),
  resourceId: z.string().nullable().optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  status: auditStatusSchema.optional().default('ok'),
  message: z.string().max(4000).nullable().optional(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().max(512).nullable().optional(),
})

export type AuditLogInput = z.infer<typeof auditLogInputSchema>

/** Call-site input — `status` defaults to `ok` in `auditLog` / `auditLogFromRequest`. */
export type AuditLogWriteInput = z.input<typeof auditLogInputSchema>

export const auditLogRowSchema = z.object({
  id: z.number(),
  actorId: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  status: auditStatusSchema,
  message: z.string().nullable(),
  createdAt: z.string(),
})
