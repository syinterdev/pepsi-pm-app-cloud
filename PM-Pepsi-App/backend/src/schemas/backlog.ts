import { z } from 'zod'
import { calendarEventSchema } from './calendar.js'

export const backlogFilterOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
})

export const backlogFilterOptionsResponseSchema = z.object({
  activities: z.array(backlogFilterOptionSchema),
  wktypes: z.array(backlogFilterOptionSchema),
  workcenters: z.array(backlogFilterOptionSchema),
  functionals: z.array(backlogFilterOptionSchema),
  equipments: z.array(backlogFilterOptionSchema),
})

export const backlogSearchBodySchema = z.object({
  year: z.number().int().min(1970).max(2100),
  month: z.number().int().min(1).max(12),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  wkctr: z.array(z.string()),
})

export const backlogEventsResponseSchema = z.object({
  items: z.array(calendarEventSchema),
  year: z.number(),
  month: z.number(),
})

export const backlogManhourSearchBodySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const backlogManhourRowSchema = z.object({
  wkorder: z.string(),
  wktype: z.string().nullable().optional(),
  syst: z.string().nullable().optional(),
  work: z.number(),
  actwork: z.number(),
  unit: z.string(),
  operationshorttext: z.string().nullable().optional(),
})

export const backlogManhourResponseSchema = z.object({
  fromDate: z.string(),
  toDate: z.string(),
  plannedMinutes: z.number(),
  plannedHours: z.number(),
  actualMinutes: z.number(),
  actualHours: z.number(),
  totalOrders: z.number(),
  completionCount: z.number(),
  completionPercent: z.number(),
  byWkzb: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      count: z.number(),
    }),
  ),
  rows: z.array(backlogManhourRowSchema),
})

export const backlogFilterDetailTeamSchema = z.object({
  count: z.number(),
  workSumMinutes: z.number(),
})

export const backlogFilterDetailWorkcenterSchema = z.object({
  code: z.string(),
  label: z.string(),
  count: z.number(),
  workSumMinutes: z.number(),
})

export const backlogFilterDetailResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  totalOrders: z.number(),
  completionCount: z.number(),
  completionPercent: z.number(),
  byWkzb: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      count: z.number(),
    }),
  ),
  /** ช่าง/ศูนย์งานที่มีงานค้างในเดือน — สำหรับ Note บนปฏิทิน */
  byWorkcenter: z.array(backlogFilterDetailWorkcenterSchema),
  teamA: backlogFilterDetailTeamSchema,
  teamB: backlogFilterDetailTeamSchema,
  teamEE: backlogFilterDetailTeamSchema,
  teamUT: backlogFilterDetailTeamSchema,
})
