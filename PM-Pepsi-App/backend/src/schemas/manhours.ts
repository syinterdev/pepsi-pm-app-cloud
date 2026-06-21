import { z } from 'zod'

export const worktimeBreakdownSchema = z.object({
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  total: z.number(),
})

export const manhourItemSchema = z.object({
  idmanhour: z.number().int(),
  idwkctr: z.string(),
  displayName: z.string().nullable(),
  position: z.string().nullable().optional(),
  wkctr: z.string().nullable(),
  stworkday: z.number().int(),
  workday: z.number().int(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  total: z.number(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const manhourListResponseSchema = z.object({
  items: z.array(manhourItemSchema),
  totalRows: z.number().int(),
})

export const manhourChartRangeSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  fromDate: z.string(),
  toDate: z.string(),
})

export const manhourHrUtilPersonSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  confirmHours: z.number(),
  manhourHours: z.number(),
  utilizationPercent: z.number(),
})

export const manhourHrListResponseSchema = manhourListResponseSchema.extend({
  range: manhourChartRangeSchema,
  utilization: z.object({
    team: z.object({
      confirmHours: z.number(),
      manhourHours: z.number(),
      utilizationPercent: z.number(),
    }),
    byPerson: z.array(manhourHrUtilPersonSchema),
    manhourWorkdayFrom: z.string().nullable(),
    manhourWorkdayTo: z.string().nullable(),
  }),
})

export const manhourUpsertBodySchema = z.object({
  idwkctr: z.string().min(1).max(64),
  /** รับ dd.mm.yyyy / yyyy-mm-dd / unix seconds */
  stworkday: z.union([z.string(), z.number()]),
  workday: z.union([z.string(), z.number()]),
  wh: z.coerce.number().min(0).default(0),
  ot1: z.coerce.number().min(0).default(0),
  ot15: z.coerce.number().min(0).default(0),
  ot1hol: z.coerce.number().min(0).default(0),
  ot2: z.coerce.number().min(0).default(0),
  ot3: z.coerce.number().min(0).default(0),
})

export const manhourOkResponseSchema = z.object({
  ok: z.literal(true),
  idmanhour: z.number().int(),
})

export const manhourImportRowResultSchema = z.object({
  rowNo: z.number().int(),
  idwkctr: z.string(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  message: z.string().optional(),
})

export const manhourImportResponseSchema = z.object({
  fileName: z.string(),
  totalRows: z.number().int(),
  inserted: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  errors: z.number().int(),
  rows: z.array(manhourImportRowResultSchema),
})

export const worktimeDailyItemSchema = z.object({
  workday: z.number().int(),
  workDate: z.string().nullable(),
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  total: z.number(),
})

export const worktimeMeResponseSchema = z.object({
  idwkctr: z.string(),
  total: worktimeBreakdownSchema.nullable(),
  items: z.array(worktimeDailyItemSchema),
})

/** — แถวมอบหมายจาก tbplangingwork */
export const worktimePlanningItemSchema = z.object({
  idplanw: z.number().int(),
  idiw37: z.number().int(),
  mntplan: z.string().nullable(),
  wkorder: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  assigner: z.string().nullable(),
  comment: z.string().nullable(),
})

export const worktimePlanningResponseSchema = z.object({
  idwkctr: z.string(),
  items: z.array(worktimePlanningItemSchema),
})

export const worktimeSummaryOverallResponseSchema = z.object({
  range: manhourChartRangeSchema,
  year: z.number().int(),
  pmYear: z.object({
    label: z.string(),
    totalPmPlanned: z.number(),
    totalPmCompleted: z.number(),
    backlog: z.number(),
  }),
  pmMonth: z.object({
    label: z.string(),
    totalPmPlanned: z.number(),
    totalPmCompleted: z.number(),
    backlog: z.number(),
  }),
  pmWeek: z.object({
    label: z.string(),
    totalPmPlanned: z.number(),
    totalPmCompleted: z.number(),
    backlog: z.number(),
  }),
  hoursYear: z.object({
    hrHours: z.number(),
    confirmHours: z.number(),
  }),
  pmByLine: z.array(
    z.object({
      productline: z.string(),
      prolinedescrip: z.string().nullable(),
      planned: z.number(),
    }),
  ),
  zb: z.array(
    z.object({
      wktype: z.enum(['ZB01', 'ZB02', 'ZB05']),
      planned: z.number(),
      completed: z.number(),
      percentCompleted: z.number(),
    }),
  ),
  technicians: z.array(
    z.object({
      idwkctr: z.string(),
      wkctr: z.string(),
      displayName: z.string().nullable(),
      hasImage: z.boolean(),
      completedOrders: z.number(),
      confirmHours: z.number(),
    }),
  ),
})

export const engUtilizationDailyRowSchema = z.object({
  idwkctr: z.string().nullable(),
  wkctr: z.string(),
  label: z.string(),
  hasImage: z.boolean(),
  displayName: z.string().nullable(),
  pmHours: z.number(),
  reactiveHours: z.number(),
  rcaHours: z.number(),
  hrHours: z.number(),
  pmPercent: z.number(),
  reactivePercent: z.number(),
  totalPercent: z.number(),
})

export const engUtilizationDailyResponseSchema = z.object({
  source: z.enum(['db', 'xlsx']),
  range: manhourChartRangeSchema.optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  periodLabel: z.string().optional(),
  file: z.string().optional(),
  sheet: z.string().optional(),
  dateLabel: z.string().nullable().optional(),
  averagePercent: z.number(),
  rows: z.array(engUtilizationDailyRowSchema),
})

export const manhoursSummaryResponseSchema = z.object({
  weeks: z.array(
    z.object({
      week: z.string(),
      planned: z.number(),
      actual: z.number(),
      backlog: z.number(),
    }),
  ),
})

export const manhourChartProfileSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string(),
  position: z.string().nullable(),
  wkctrtype: z.string().nullable(),
  imgmember: z.string().nullable(),
  hasImage: z.boolean(),
})

export const manhourZbStatSchema = z.object({
  wktype: z.string(),
  planned: z.number(),
  confirmed: z.number(),
  percent: z.number(),
})

export const manhourChartPerformanceResponseSchema = z.object({
  range: manhourChartRangeSchema,
  profile: manhourChartProfileSchema,
  totalPlannedOrders: z.number(),
  utilizationPercent: z.number(),
  confirmHours: z.number(),
  manhourTotal: z.number(),
  zb: z.array(manhourZbStatSchema),
})

export const manhourChartBreakdownResponseSchema = z.object({
  range: manhourChartRangeSchema,
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  confirmHours: z.number(),
})

export const manhourHrConfirmRowSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  totalManhours: z.number(),
  confirmHours: z.number(),
  utilizationPercent: z.number(),
})

export const manhourHrConfirmReportResponseSchema = z.object({
  range: manhourChartRangeSchema,
  period: z.enum(['month', 'week']),
  periodLabel: z.string(),
  totals: manhourChartBreakdownResponseSchema,
  rows: z.array(manhourHrConfirmRowSchema),
})

export const manhourZbByPersonRowSchema = z.object({
  wkctr: z.string(),
  displayName: z.string().nullable(),
  zb01Planned: z.number(),
  zb01Confirmed: z.number(),
  zb02Planned: z.number(),
  zb02Confirmed: z.number(),
  zb05Planned: z.number(),
  zb05Confirmed: z.number(),
})

export const manhourZbByPersonResponseSchema = z.object({
  range: manhourChartRangeSchema,
  rows: z.array(manhourZbByPersonRowSchema),
})

export type ManhourItem = z.infer<typeof manhourItemSchema>
export type ManhourUpsertBody = z.infer<typeof manhourUpsertBodySchema>
export type ManhourImportResponse = z.infer<typeof manhourImportResponseSchema>
export type WorktimeDailyItem = z.infer<typeof worktimeDailyItemSchema>
