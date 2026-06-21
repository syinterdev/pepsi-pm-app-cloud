import { z } from 'zod'
import { weekToWeekRowSchema } from './activity-log.js'

export const reportsRangeSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  fromDate: z.string(),
  toDate: z.string(),
})

export const reportsKpiResponseSchema = z.object({
  range: reportsRangeSchema,
  labels: z.array(z.string()),
  utilization: z.array(z.number()),
  backlogHours: z.array(z.number()),
  weekToWeek: z.array(weekToWeekRowSchema),
})

export const summaryWeeklyUtilizationBarSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  summaryHours: z.number(),
})

export const summaryWeeklyRowSchema = z.object({
  wkctr: z.string(),
  idwkctr: z.string(),
  displayName: z.string().nullable(),
  hasImage: z.boolean(),
  pmWork: z.number(),
  pmUnit: z.string(),
  reactiveWork: z.number(),
  reactiveUnit: z.string(),
  rcaWork: z.number(),
  rcaUnit: z.string(),
  woCount: z.number().int(),
  pmHours: z.number(),
  reactiveHours: z.number(),
  hrHour: z.number(),
  otHour: z.number(),
  percentPm: z.number(),
  percentReactive: z.number(),
  percentRca: z.number(),
  percentTotal: z.number(),
})

export const reportsImportCoverageSchema = z.object({
  iw37nCount: z.number().int(),
  iw37nBscstartFrom: z.string().nullable(),
  iw37nBscstartTo: z.string().nullable(),
  manhourCount: z.number().int(),
  manhourWorkdayFrom: z.string().nullable(),
  manhourWorkdayTo: z.string().nullable(),
  workOrdersInRange: z.number().int(),
  confirmationsInRange: z.number().int(),
  suggestedSapRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .nullable(),
  rangeOverlapsSap: z.boolean(),
})

export const summaryWeeklyResponseSchema = z.object({
  range: reportsRangeSchema,
  utilizationChart: z.array(summaryWeeklyUtilizationBarSchema),
  rows: z.array(summaryWeeklyRowSchema),
  importCoverage: reportsImportCoverageSchema,
})

export type ReportsKpiResponse = z.infer<typeof reportsKpiResponseSchema>
export type SummaryWeeklyResponse = z.infer<typeof summaryWeeklyResponseSchema>
