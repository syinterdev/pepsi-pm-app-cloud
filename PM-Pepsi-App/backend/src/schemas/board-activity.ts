import { z } from 'zod'
import { BOARD_PERIOD_IDS } from '../lib/board-period.js'

export const boardActivityKindSchema = z.enum(['assigned', 'closed'])

export const boardActivityItemSchema = z.object({
  id: z.string(),
  kind: boardActivityKindSchema,
  occurredAt: z.string(),
  wkorder: z.string(),
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  hasImage: z.boolean(),
  /** ป้ายภาษาไทยสำหรับ feed — «รับงาน» / «ปิดงาน» */
  label: z.string(),
})

export const boardActivityResponseSchema = z.object({
  period: z.enum(BOARD_PERIOD_IDS),
  range: z.object({
    from: z.string(),
    to: z.string(),
  }),
  timezone: z.string(),
  limit: z.number().int(),
  items: z.array(boardActivityItemSchema),
})

export const boardActivityQuerySchema = z.object({
  period: z.enum(BOARD_PERIOD_IDS).default('7d'),
  limit: z.coerce.number().int().min(1).max(12).default(12),
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
})

export type BoardActivityItem = z.infer<typeof boardActivityItemSchema>
export type BoardActivityResponse = z.infer<typeof boardActivityResponseSchema>
