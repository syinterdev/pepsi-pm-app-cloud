import { z } from 'zod'
import { auditStatusSchema } from './audit-log.js'

export const activityLogItemSchema = z.object({
  id: z.string(),
  source: z.enum(['audit', 'userlog']),
  actorId: z.string().nullable(),
  actorRole: z.string().nullable(),
  actorDisplayName: z.string().nullable(),
  productLine: z.string().nullable(),
  workOrder: z.string().nullable(),
  jobDetail: z.string().nullable(),
  resourceLabel: z.string().nullable(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  action: z.string(),
  actionLabel: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  status: auditStatusSchema,
  message: z.string().nullable(),
  createdAt: z.string(),
})

export const activityLogListResponseSchema = z.object({
  items: z.array(activityLogItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export type ActivityLogListResponse = z.infer<typeof activityLogListResponseSchema>

export const weekToWeekRowSchema = z.object({
  weekLabel: z.string(),
  prevWeekLabel: z.string(),
  utilization: z.number(),
  utilizationPrev: z.number(),
  utilizationDelta: z.number(),
  backlogHours: z.number(),
  backlogHoursPrev: z.number(),
  backlogDelta: z.number(),
})
