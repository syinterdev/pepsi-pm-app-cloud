import { z } from 'zod'

/** 7 จุด — รายวัน ย้อนหลัง 7 วัน (สำหรับ sparkline บนแดชบอร์ด) */
export const dashboardTrendSeriesSchema = z.array(z.number().int().nonnegative()).length(7)

export const dashboardSummarySchema = z.object({
  openOrders: z.number(),
  closedThisMonth: z.number(),
  pendingPersonnel: z.number(),
  iw37nLastImport: z.string().nullable(),
  trends: z.object({
    openDaily: dashboardTrendSeriesSchema,
    closedDaily: dashboardTrendSeriesSchema,
    pendingDaily: dashboardTrendSeriesSchema,
    importDaily: dashboardTrendSeriesSchema,
  }),
})

export const dashboardSummaryQuerySchema = z.object({
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
})
