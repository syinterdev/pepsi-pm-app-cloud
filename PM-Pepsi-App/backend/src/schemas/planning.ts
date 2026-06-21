import { z } from 'zod'

export const planningItemSchema = z.object({
  id: z.string(),
  planName: z.string(),
  line: z.string(),
  month: z.string(),
  status: z.enum(['OPEN', 'CONF', 'CLOS']),
  owner: z.string(),
  wkorder: z.string().optional(),
  wktype: z.string().optional(),
  planDate: z.string().optional(),
  movedDate: z.string().optional(),
  closedDate: z.string().optional(),
  /** ชม.งานจาก IW37N (work + unit) */
  workHours: z.number().positive().optional(),
  /** wkctr บนใบงานหลัง import — อ้างอิง Auto default */
  importWkctr: z.string().optional(),
  /** สถานะรับทราบของช่างที่ล็อกอิน (tbplangingwork) */
  ackStatus: z.enum(['pending', 'acknowledged', 'declined']).optional(),
  ackAt: z.string().nullable().optional(),
  ackChannel: z.enum(['telegram', 'web']).nullable().optional(),
})

export const planningResponseSchema = z.object({
  items: z.array(planningItemSchema),
})

export const planningAssignBodySchema = z.object({
  idiw37: z.coerce.number().int().positive(),
  mode: z.enum(['P', 'G']).default('P'),
  code: z.string().min(1).max(64),
  comment: z.string().max(1000).optional(),
})

export const planningAssignResponseSchema = z.object({
  ok: z.literal(true),
  assigned: z.array(z.string()),
  skipped: z.array(z.string()).optional(),
})

export const planningAckResponseSchema = z.object({
  ok: z.literal(true),
  idiw37: z.number().int(),
  wkctr: z.string(),
  ackStatus: z.literal('acknowledged'),
  ackAt: z.string(),
  alreadyAcked: z.boolean(),
})

export const planningAckSummaryItemSchema = z.object({
  wkctr: z.string(),
  ackStatus: z.string(),
  ackAt: z.string().nullable(),
  ackChannel: z.string().nullable(),
})

export const planningAckSummaryResponseSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  total: z.number().int(),
  acknowledged: z.number().int(),
  pending: z.number().int(),
  items: z.array(planningAckSummaryItemSchema),
})
