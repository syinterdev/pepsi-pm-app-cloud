import { z } from 'zod'
import { BOARD_PERIOD_IDS } from '../lib/board-period.js'

export const boardPmReadingsQuerySchema = z.object({
  period: z.enum(BOARD_PERIOD_IDS).default('week'),
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
  limit: z.coerce.number().int().min(1).max(12).default(8),
})

export const boardPmReadingPointSchema = z.object({
  label: z.string(),
  v1: z.number(),
  v2: z.number(),
  v3: z.number(),
})

export const boardPmReadingGroupSchema = z.object({
  wkorder: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  kind: z.enum(['current_3phase', 'vibration_dst_db']),
  kindLabel: z.string(),
  unit: z.string(),
  axisLabels: z.tuple([z.string(), z.string(), z.string()]),
  latestAt: z.string(),
  latestV1: z.number(),
  latestV2: z.number(),
  latestV3: z.number(),
  points: z.array(boardPmReadingPointSchema),
})

export const boardPmReadingsResponseSchema = z.object({
  period: z.enum(BOARD_PERIOD_IDS),
  range: z.object({ from: z.string(), to: z.string() }),
  summary: z.object({
    totalReadings: z.number().int(),
    groupCount: z.number().int(),
  }),
  groups: z.array(boardPmReadingGroupSchema),
})

export const pmReadingsExportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
})

export type BoardPmReadingGroup = z.infer<typeof boardPmReadingGroupSchema>
export type BoardPmReadingsResponse = z.infer<typeof boardPmReadingsResponseSchema>
