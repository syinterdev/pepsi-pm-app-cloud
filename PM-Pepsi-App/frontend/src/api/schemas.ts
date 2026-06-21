/**
 * สัญญา API ฝั่ง client — ล็อก shape ให้ตรงกับ Express backend
 * เพิ่ม endpoint ใหม่: ประกาศ schema ที่นี่ก่อนหรือพร้อมกับ route handler บน backend
 */
import { z } from 'zod'

export const workOrderListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  orderType: z.string(),
  equipment: z.string(),
  functLoc: z.string(),
  priority: z.string(),
  status: z.string(),
  basicStart: z.string(),
  basicFinish: z.string(),
  plant: z.string(),
  workCenter: z.string(),
  systemStatus: z.string(),
  userStatus: z.string(),
  description: z.string(),
})

export const workOrdersResponseSchema = z.object({
  items: z.array(workOrderListItemSchema),
})

export const workOrderFilterOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
})

export const workOrderFilterOptionsResponseSchema = z.object({
  activities: z.array(workOrderFilterOptionSchema),
  wktypes: z.array(workOrderFilterOptionSchema),
  statuses: z.array(workOrderFilterOptionSchema),
  workcenters: z.array(workOrderFilterOptionSchema),
  teams: z.array(workOrderFilterOptionSchema),
  functionals: z.array(workOrderFilterOptionSchema),
  equipments: z.array(workOrderFilterOptionSchema),
})

export const workOrderSearchBodySchema = z.object({
  q: z.string().optional(),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  status: z.array(z.string()),
  wkctr: z.array(z.string()),
  team: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const woPmPhaseSchema = z.enum(['create', 'rel', 'confirm'])
export const pmExecutionStatusSchema = z.enum(['in_progress', 'done', 'closed'])

export const plannerPipelineStatusSchema = z.enum([
  'unassigned',
  'assigned',
  'in_progress',
  'closed',
])

export const plannerPipelineBadgeSchema = z.enum([
  'ack_pending',
  'ack_done',
  'qc_pending',
  'qc_approved',
  'qc_rejected',
])

export const workOrderSearchRowSchema = z.object({
  id: z.string(),
  wkorder: z.string(),
  mntplan: z.string(),
  wktype: z.string(),
  mat: z.string(),
  equdescrip: z.string(),
  funcdescrip: z.string(),
  work: z.number(),
  untime: z.string(),
  displayDate: z.string(),
  team: z.string(),
  wkstcolor: z.string(),
  operationshorttext: z.string(),
  syst: z.string(),
  pmPhase: woPmPhaseSchema,
  confirmQcStatus: z.enum(['pending', 'approved', 'rejected']).nullable(),
  qcReadyForReview: z.boolean(),
})

export const workOrderSearchResponseSchema = z.object({
  items: z.array(workOrderSearchRowSchema),
})

export const workOrderFilterDetailTeamSchema = z.object({
  count: z.number(),
  workSumMinutes: z.number(),
})

export const workOrderFilterDetailResponseSchema = z.object({
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
  teamA: workOrderFilterDetailTeamSchema,
  teamB: workOrderFilterDetailTeamSchema,
  teamEE: workOrderFilterDetailTeamSchema,
  teamUT: workOrderFilterDetailTeamSchema,
})

export const workOrderTeamPatchSchema = z.object({
  team: z.enum(['', 'A', 'B', 'EE', 'UT']),
})

export const workOrderTeamPatchResponseSchema = z.object({
  ok: z.literal(true),
})

export const workOrderTeamBulkBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  team: z.enum(['', 'A', 'B', 'EE', 'UT']),
})

export const workOrderTeamBulkResponseSchema = z.object({
  ok: z.literal(true),
  team: z.enum(['', 'A', 'B', 'EE', 'UT']),
  updated: z.array(z.string()),
  notFound: z.array(z.string()),
})

export const workOrderWorkflowStepSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  key: z.enum(['team', 'assign', 'worktime']),
  label: z.string(),
  done: z.boolean(),
})

export const workOrderWorkflowSchema = z.object({
  steps: z.array(workOrderWorkflowStepSchema),
  suffix: z.string(),
})

export const workOrderConfirmQcSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).nullable(),
  statusLabel: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  note: z.string().nullable(),
  imageCount: z.number().int(),
  imageBefore: z.number().int(),
  imageAfter: z.number().int(),
  closeCount: z.number().int(),
  worktimeCount: z.number().int(),
  readyForReview: z.boolean(),
  approved: z.boolean(),
})

export const workOrderMovePlanSchema = z.object({
  movedDate: z.string(),
  moveCount: z.number(),
  reasonCode: z.string(),
  reasonName: z.string(),
  movedByWkctr: z.string(),
  comment: z.string(),
})

export const workOrderDetailSchema = z.object({
  item: workOrderListItemSchema.extend({
    pmPhase: woPmPhaseSchema,
    wkorder: z.string(),
    team: z.string(),
    mat: z.string(),
    mntplan: z.string(),
    opac: z.string(),
    work: z.number(),
    actwork: z.number(),
    untime: z.string(),
    resourcesLabel: z.string(),
    plannedDate: z.string(),
    finishDate: z.string(),
    statusColor: z.string(),
    canMovePlan: z.boolean(),
    movePlan: workOrderMovePlanSchema.nullable(),
    workflow: workOrderWorkflowSchema,
    confirmQc: workOrderConfirmQcSchema,
    operations: z.array(
      z.object({
        no: z.string(),
        desc: z.string(),
        wc: z.string(),
        hours: z.number(),
      }),
    ),
    components: z.array(
      z.object({
        material: z.string(),
        qty: z.number(),
        unit: z.string(),
      }),
    ),
  }),
})

export const pmMeasurementKindSchema = z.enum([
  'current_3phase',
  'vibration_dst_db',
  'none',
])

export const woPmReadingSchema = z.object({
  idreading: z.number().int(),
  machine: z.string(),
  pmlist: z.string(),
  kind: z.enum(['current_3phase', 'vibration_dst_db']),
  measuredAt: z.string(),
  v1: z.number(),
  v2: z.number(),
  v3: z.number().nullable(),
  unit: z.string(),
  warningLimit: z.number().nullable(),
  alarmLimit: z.number().nullable(),
  wkctr: z.string(),
})

export const woPmNoteEntrySchema = z.object({
  identry: z.number().int(),
  note: z.string(),
  wkctr: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
})

export const woPmExecutionSchema = z.object({
  notes: z.array(woPmNoteEntrySchema),
  note: z.string(),
  noteUpdatedAt: z.string().nullable(),
  noteWkctr: z.string(),
  canEdit: z.boolean(),
  readings: z.array(woPmReadingSchema),
})

export const woPmPage2FormSchema = z.object({
  activityReportWkctr: z.string().nullable(),
  completedByName: z.string().nullable(),
  closedDate: z.string().nullable(),
  signatureText: z.string().nullable(),
  signatureAt: z.string().nullable(),
  signatureAction: z.enum(['approved', 'rejected']).nullable(),
  equipmentOk: z.enum(['Y', 'N']).nullable(),
})

export const workOrderTaskListItemSchema = z.object({
  tasklist: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  displayLine: z.string(),
  machinestatus: z.number().nullable(),
  pmman: z.number().nullable().optional(),
  pmday: z.number().nullable().optional(),
  mat: z.string(),
  matdescrip: z.string(),
  measurementKind: pmMeasurementKindSchema,
  mpoint: z.string(),
  measurementTitle: z.string(),
  axisLabels: z.tuple([z.string(), z.string(), z.string()]),
  unit: z.string(),
})

export const workOrderTaskListSchema = z.object({
  mntplan: z.string(),
  summary: z
    .object({
      tasklist: z.string(),
      legacy: z.string(),
      productline: z.string(),
      zone: z.string(),
      wkctrtype: z.string(),
    })
    .nullable(),
  items: z.array(workOrderTaskListItemSchema),
})

export const workOrderMachineSchema = z.object({
  zone: z.string(),
  wkctrtype: z.string(),
  productline: z.string(),
  uptime: z.number().nullable(),
  machines: z.array(z.string()),
})

export const workOrderMaterialItemSchema = z.object({
  matpo: z.string(),
  pstngdate: z.string(),
  materialdesc: z.string(),
  amountinlc: z.number(),
  mvt: z.string(),
  material: z.string(),
})

export const workOrderMaterialsSchema = z.object({
  items: z.array(workOrderMaterialItemSchema),
})

export const workOrderPlanningGroupSchema = z.object({
  wkctrgroup: z.string(),
  wkctrdescription: z.string(),
})

export const workOrderPlanningAssignedSchema = z.object({
  idplanw: z.number().int().nullable().optional(),
  kind: z.enum(['person', 'group']),
  code: z.string(),
  displayName: z.string(),
  wkctrtype: z.string().optional(),
  position: z.string().optional(),
  pwcomment: z.string(),
  pwteam: z.string(),
  ackStatus: z.enum(['pending', 'acknowledged', 'declined']).optional(),
  ackAt: z.string().nullable().optional(),
  ackChannel: z.enum(['telegram', 'web']).nullable().optional(),
})

export const closeWoAccessSchema = z.object({
  canView: z.boolean(),
  canWrite: z.boolean(),
  reason: z.enum(['not_technician', 'not_assigned', 'pending_ack']).optional(),
  myAssignment: z
    .object({
      ackStatus: z.enum(['pending', 'acknowledged', 'declined']).optional(),
      ackChannel: z.enum(['telegram', 'web']).nullable().optional(),
      ackAt: z.string().nullable().optional(),
    })
    .optional(),
})

export const workOrderPlanningSchema = z.object({
  canAssign: z.boolean(),
  assigned: workOrderPlanningAssignedSchema.nullable(),
  assignees: z.array(workOrderPlanningAssignedSchema).default([]),
  workcenters: z.array(
    z.object({
      wkctr: z.string(),
      displayName: z.string(),
      hrHours: z.number().nullable().optional(),
      plannedHours: z.number().nullable().optional(),
      availableHours: z.number().nullable().optional(),
      shiftTags: z.array(z.enum(['AA', 'BB'])).optional(),
      craftTags: z.array(z.enum(['EE', 'UT'])).optional(),
    }),
  ),
  groups: z.array(workOrderPlanningGroupSchema),
  closeWoAccess: closeWoAccessSchema,
})

export const pmDataReadinessSchema = z.object({
  mntplan: z.string(),
  tasklistPublished: z.boolean(),
  taskCount: z.number().int(),
  currentTaskCount: z.number().int(),
  vibrationTaskCount: z.number().int(),
  readingCount: z.number().int(),
})

export type PmDataReadiness = z.infer<typeof pmDataReadinessSchema>

export const workOrderModalDetailSchema = z.object({
  date: z.string(),
  woHeader: z.object({
    wkorder: z.string(),
    printMetaLine: z.string(),
    functionalLocation: z.string(),
    equipment: z.string(),
    descriptionLine1: z.string(),
    descriptionLine2: z.string(),
    workCentre: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    activityType: z.string(),
    revision: z.string(),
    priority: z.string(),
    man: z.string().optional(),
    machineRunStatus: z.string().optional(),
    techId: z.string(),
    sysCond: z.string(),
    description: z.string(),
    permitStatus: z.string(),
    headerShortText: z.string(),
    objectList: z.string(),
    operationNumber: z.string(),
    operationWorkCentre: z.string(),
    operationText: z.string(),
    unloadingPoint: z.string(),
    operationLongText: z
      .array(
        z.object({
          lineNo: z.number().int(),
          machine: z.string(),
          pmlist: z.string(),
        }),
      )
      .optional(),
  }),
  taskList: workOrderTaskListSchema,
  machine: workOrderMachineSchema,
  planning: workOrderPlanningSchema,
  materials: workOrderMaterialsSchema,
  pmExecution: woPmExecutionSchema,
  page2Form: woPmPage2FormSchema,
  dataReadiness: pmDataReadinessSchema,
})

export const woPmNoteBodySchema = z.object({
  note: z.string().trim().min(1).max(4000),
})

export const woPmNoteResponseSchema = z.object({
  ok: z.literal(true),
  entry: woPmNoteEntrySchema,
})

export const woPmPage2BodySchema = z.object({
  equipmentOk: z.enum(['Y', 'N']),
})

export const woPmPage2ResponseSchema = z.object({
  ok: z.literal(true),
  page2Form: woPmPage2FormSchema,
})

export const woPmReadingBodySchema = z
  .object({
    machine: z.string().min(1).max(128),
    pmlist: z.string().min(1).max(128),
    kind: z.enum(['current_3phase', 'vibration_dst_db']),
    measuredAt: z.string().datetime().optional(),
    v1: z.number().finite(),
    v2: z.number().finite(),
    v3: z.number().finite().nullable().optional(),
    warningLimit: z.number().finite().nullable().optional(),
    alarmLimit: z.number().finite().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'current_3phase') {
      if (data.v3 == null || !Number.isFinite(data.v3)) {
        ctx.addIssue({ code: 'custom', path: ['v3'], message: 'v3 required for current_3phase' })
      }
    }
  })

export const woPmReadingResponseSchema = z.object({
  item: woPmReadingSchema,
})

export const pmReadingBatchItemSchema = z
  .object({
    machine: z.string().min(1).max(128),
    pmlist: z.string().min(1).max(128),
    kind: z.enum(['current_3phase', 'vibration_dst_db']),
    measuredAt: z.string().datetime().optional(),
    v1: z.number().finite(),
    v2: z.number().finite(),
    v3: z.number().finite().nullable().optional(),
    warningLimit: z.number().finite().nullable().optional(),
    alarmLimit: z.number().finite().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'current_3phase') {
      if (data.v3 == null || !Number.isFinite(data.v3)) {
        ctx.addIssue({ code: 'custom', path: ['v3'], message: 'v3 required for current_3phase' })
      }
    }
  })

export const pmReadingBatchBodySchema = z.object({
  wkorder: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  items: z.array(pmReadingBatchItemSchema).min(1).max(200),
})

export const pmReadingImportResultSchema = z.object({
  ok: z.literal(true),
  imported: z.number().int(),
  failed: z.number().int(),
  errors: z.array(
    z.object({
      rowNo: z.number().int(),
      wkorder: z.string(),
      message: z.string(),
    }),
  ),
})

export type WoPmReading = z.infer<typeof woPmReadingSchema>
export type WoPmExecution = z.infer<typeof woPmExecutionSchema>
export type WoPmPage2Form = z.infer<typeof woPmPage2FormSchema>
export type WorkOrderTaskListItemApi = z.infer<typeof workOrderTaskListItemSchema>

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
  period: z.enum(['today', '7d', 'week']),
  range: z.object({ from: z.string(), to: z.string() }),
  summary: z.object({
    totalReadings: z.number().int(),
    groupCount: z.number().int(),
  }),
  groups: z.array(boardPmReadingGroupSchema),
})

export const workOrderPlanningUpsertBodySchema = z.object({
  mode: z.enum(['P', 'G']),
  code: z.string().min(1),
  comment: z.string().optional(),
})

export const workOrderPlanningBatchBodySchema = z.object({
  wkctrs: z.array(z.string().min(1)).min(1).max(200),
  comment: z.string().max(255).optional(),
})

export const workOrderPlanningBatchResponseSchema = z.object({
  ok: z.literal(true),
  assigned: z.array(z.string()),
  skipped: z.array(z.string()),
  notFound: z.array(z.string()),
})

export const workOrderPlanningOkResponseSchema = z.object({
  ok: z.literal(true),
})

export const planningAssignBodySchema = z.object({
  idiw37: z.number().int().positive(),
  mode: z.enum(['P', 'G']),
  code: z.string().min(1),
  comment: z.string().optional(),
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

export const planningAckSummaryResponseSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  total: z.number().int(),
  acknowledged: z.number().int(),
  pending: z.number().int(),
  items: z.array(
    z.object({
      wkctr: z.string(),
      ackStatus: z.string(),
      ackAt: z.string().nullable(),
      ackChannel: z.string().nullable(),
    }),
  ),
})

export const movePlanReasonSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const movePlanReasonsResponseSchema = z.object({
  items: z.array(movePlanReasonSchema),
})

export const movePlanRequestSchema = z.object({
  idiw37: z.string(),
  targetDate: z.string(),
  reasonCode: z.string().optional(),
  comment: z.string().optional(),
})

export const movePlanResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  mpcount: z.number(),
})

export const workOrderSuggestionSchema = z.object({
  id: z.string(),
  wkorder: z.string(),
  wktype: z.string(),
  label: z.string(),
})

export const workOrderSuggestionsResponseSchema = z.object({
  items: z.array(workOrderSuggestionSchema),
})

export const dashboardTrendSeriesSchema = z.array(z.number()).length(7)

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

export const calendarEventHoverDetailSchema = z.object({
  zoneTitle: z.string().optional(),
  workOrder: z.string(),
  wktype: z.string().optional(),
  wktypeLabel: z.string().optional(),
  pmPhase: woPmPhaseSchema.optional(),
  syst: z.string().optional(),
  resourceName: z.string().optional(),
  wkctr: z.string().optional(),
  functionalDesc: z.string().optional(),
  planDate: z.string().optional(),
  finishDate: z.string().optional(),
  orderFrameStart: z.string().optional(),
  orderFrameEnd: z.string().optional(),
  movedToDate: z.string().optional(),
  moveReason: z.string().optional(),
})

export type CalendarEventHoverDetail = z.infer<typeof calendarEventHoverDetailSchema>

export const calendarEventItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  orderId: z.string(),
  color: z.string(),
  description: z.string().optional(),
  hoverDetail: calendarEventHoverDetailSchema.optional(),
  canMovePlan: z.boolean().default(true),
  syst: z.string().optional(),
  pmPhase: woPmPhaseSchema.optional(),
  pmExecutionStatus: pmExecutionStatusSchema.optional(),
  activityCode: z.string().optional(),
  moveCount: z.number().int().positive().optional(),
  wkctr: z.string().optional(),
  workHours: z.number().positive().optional(),
  planStartIso: z.string().optional(),
  planEndIso: z.string().optional(),
  moveReasonRequired: z.boolean().optional(),
  tecoBellAlert: z.boolean().optional(),
  displayStatus: z.enum(['in_progress', 'overdue', 'moved', 'completed']).optional(),
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
  pipelineStatus: plannerPipelineStatusSchema.optional(),
  pipelineBadges: z.array(plannerPipelineBadgeSchema).optional(),
})

export const calendarEventsResponseSchema = z.object({
  items: z.array(calendarEventItemSchema),
  year: z.number(),
  month: z.number(),
  dayHourTotals: z.record(z.string(), z.number()).optional(),
  dayOrderCounts: z.record(z.string(), z.number()).optional(),
})

export const backlogFilterOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
})

export const calendarFilterOptionsResponseSchema = z.object({
  activities: z.array(backlogFilterOptionSchema),
  wktypes: z.array(backlogFilterOptionSchema),
  statuses: z.array(backlogFilterOptionSchema),
  displayStatuses: z.array(backlogFilterOptionSchema),
  pmPhases: z.array(backlogFilterOptionSchema),
  priorities: z.array(backlogFilterOptionSchema),
  workcenters: z.array(backlogFilterOptionSchema),
  teams: z.array(backlogFilterOptionSchema),
  functionals: z.array(backlogFilterOptionSchema),
  equipments: z.array(backlogFilterOptionSchema),
})

export const calendarSearchBodySchema = z.object({
  year: z.number(),
  month: z.number(),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  status: z.array(z.string()),
  displayStatus: z.array(z.string()),
  pmPhase: z.array(woPmPhaseSchema),
  wkctr: z.array(z.string()),
  team: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  priority: z.array(z.string()),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export const backlogFilterOptionsResponseSchema = z.object({
  activities: z.array(backlogFilterOptionSchema),
  wktypes: z.array(backlogFilterOptionSchema),
  workcenters: z.array(backlogFilterOptionSchema),
  functionals: z.array(backlogFilterOptionSchema),
  equipments: z.array(backlogFilterOptionSchema),
})

export const backlogSearchBodySchema = z.object({
  year: z.number(),
  month: z.number(),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  wkctr: z.array(z.string()),
})

export const backlogEventsResponseSchema = z.object({
  items: z.array(calendarEventItemSchema),
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
  byWorkcenter: z.array(backlogFilterDetailWorkcenterSchema),
  teamA: backlogFilterDetailTeamSchema,
  teamB: backlogFilterDetailTeamSchema,
  teamEE: backlogFilterDetailTeamSchema,
  teamUT: backlogFilterDetailTeamSchema,
})

export const iw37nBatchItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  importedAt: z.string(),
  rows: z.number(),
  sha256: z.string(),
  status: z.enum(['OK', 'PARTIAL', 'ERR']),
  isDuplicate: z.boolean(),
  duplicateOfBatchId: z.string().nullable(),
})

export const iw37nBatchesResponseSchema = z.object({
  items: z.array(iw37nBatchItemSchema),
})

export const integrationJobTypeSchema = z.enum([
  'iw37n_in_scan',
  'confirm_in_scan',
  'inbound_scan',
])

export const integrationJobItemSchema = z.object({
  id: z.string(),
  jobType: integrationJobTypeSchema,
  status: z.enum(['running', 'success', 'failed', 'partial']),
  trigger: z.enum(['manual', 'schedule']),
  fileName: z.string().nullable(),
  sha256: z.string().nullable(),
  batchId: z.string().nullable(),
  summary: z.record(z.string(), z.unknown()),
  errorText: z.string().nullable(),
  startedBy: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
})

export const integrationPendingFileSchema = z.object({
  name: z.string(),
  sizeBytes: z.number(),
})

export const integrationStatusResponseSchema = z.object({
  rootDir: z.string(),
  inboundIw37nDir: z.string(),
  inboundConfirmDir: z.string(),
  watchEnabled: z.boolean(),
  watchIntervalMinutes: z.number(),
  pendingIw37nFiles: z.array(integrationPendingFileSchema),
  pendingConfirmFiles: z.array(integrationPendingFileSchema),
  lastJob: integrationJobItemSchema.nullable(),
})

export const integrationRunResponseSchema = z.object({
  job: integrationJobItemSchema,
})

export const integrationJobsResponseSchema = z.object({
  items: z.array(integrationJobItemSchema),
})

const iw37nImportRowSchema = z.object({
  rowNo: z.number(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  wkorder: z.string(),
  opac: z.string(),
  mntplan: z.string(),
  wktype: z.string(),
  mat: z.string(),
  syst: z.string(),
  message: z.string(),
})

export const iw37nImportSummarySchema = z.object({
  fileName: z.string(),
  sha256: z.string(),
  totalRows: z.number(),
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.number(),
  isDuplicate: z.boolean(),
  duplicateOfBatchId: z.string().nullable(),
  wouldStatus: z.enum(['OK', 'PARTIAL', 'ERR']),
  errorGroups: z.array(z.object({ message: z.string(), count: z.number() })),
})

export type Iw37nBatchItem = z.infer<typeof iw37nBatchItemSchema>
export type Iw37nImportSummary = z.infer<typeof iw37nImportSummarySchema>

export const iw37nImportPreviewResponseSchema = z.object({
  preview: z.literal(true),
  summary: iw37nImportSummarySchema,
  rows: z.array(iw37nImportRowSchema),
})

export type Iw37nImportPreviewResponse = z.infer<typeof iw37nImportPreviewResponseSchema>

export const iw37nImportResponseSchema = z.object({
  batch: iw37nBatchItemSchema,
  rows: z.array(iw37nImportRowSchema),
})

export const iw37nBatchRowsResponseSchema = z.object({
  batchId: z.string(),
  items: z.array(
    z.object({
      rowNo: z.number(),
      action: z.enum(['inserted', 'updated', 'skipped', 'error']),
      wkorder: z.string(),
      opac: z.string(),
      mntplan: z.string(),
      wktype: z.string(),
      mat: z.string(),
      syst: z.string(),
      message: z.string(),
      createdAt: z.string(),
    }),
  ),
})

export const iw37nItemSchema = z.object({
  idiw37: z.number(),
  mntplan: z.string(),
  wkorder: z.string(),
  wktype: z.string(),
  mat: z.string(),
  bscstart: z.number().nullable(),
  actfinish: z.number().nullable(),
  systemstatus: z.string(),
  syst: z.string(),
  opac: z.string(),
  operationshorttext: z.string(),
  ostdescription: z.string(),
  cknow: z.string(),
  wkctr: z.string(),
  work: z.number().nullable(),
  actwork: z.number().nullable(),
  untime: z.number().nullable(),
  equipment: z.string(),
  equdescrip: z.string(),
  functionalloc: z.string(),
  funcdescrip: z.string(),
  team: z.string().nullable(),
})

export const iw37nItemsResponseSchema = z.object({
  items: z.array(iw37nItemSchema),
})

export const iw37nItemResponseSchema = z.object({
  item: iw37nItemSchema,
})

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  time: z.string(),
  db: z.enum(['ok', 'error']).optional(),
})

/** POST /api/v1/auth/login — workcenter | member */
export const loginModeSchema = z.enum(['workcenter', 'member'])

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  mode: loginModeSchema.optional(),
})

export const authUserSchema = z.object({
  idwkctr: z.string(),
  username: z.string(),
  wkctr: z.string(),
  plnt: z.string().nullable().optional(),
  userst: z.string(),
  sysstatus: z.string(),
  roleNameTh: z.string().optional(),
  roleNameEn: z.string().optional(),
  userLevel: z.number().optional(),
  fullnameTh: z.string().optional(),
  fullnameEng: z.string().optional(),
  titlewkctr: z.string().optional(),
  namewkctr: z.string().optional(),
  surnamewkctr: z.string().optional(),
  imgMember: z.string().nullable().optional(),
  accountType: z.enum(['workcenter', 'member']).optional(),
  memId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  passMustChange: z.boolean().optional(),
  impersonatedBy: z
    .object({
      idwkctr: z.string(),
      username: z.string(),
      userst: z.string(),
    })
    .optional(),
})

export type AuthUser = z.infer<typeof authUserSchema>

export const adminMemberItemSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  fullname: z.string().nullable(),
  status: z.string().nullable(),
  lastLogin: z.string().nullable(),
  passMustChange: z.boolean(),
})

export type AdminMemberItem = z.infer<typeof adminMemberItemSchema>

export const adminMembersListResponseSchema = z.object({
  items: z.array(adminMemberItemSchema),
  total: z.number().int(),
})

export const adminResetPasswordResponseSchema = z.object({
  ok: z.literal(true),
  temporaryPassword: z.string(),
  passMustChange: z.literal(true),
})

export const adminLockResponseSchema = z.object({
  ok: z.literal(true),
  workstatus: z.string().optional(),
  status: z.string().optional(),
})

export const adminImpersonateResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export const logoutRequestSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  accountType: z.enum(['workcenter', 'member']).optional(),
})

export const navMenuItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('heading'),
    label: z.string(),
    menuright: z.string(),
  }),
  z.object({
    kind: z.literal('item'),
    label: z.string(),
    to: z.string(),
    menuright: z.string(),
    icon: z.string().optional(),
    end: z.boolean().optional(),
  }),
])

export type NavMenuItem = z.infer<typeof navMenuItemSchema>

export const navMenuResponseSchema = z.object({
  items: z.array(navMenuItemSchema),
})

export const logoutResponseSchema = z.object({
  ok: z.literal(true),
})

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'ยืนยันรหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export const changePasswordResponseSchema = z.object({
  ok: z.literal(true),
  token: z.string(),
  user: authUserSchema,
})

export const authSessionResponseSchema = z.object({
  user: authUserSchema,
})

export const userProfileSchema = z.object({
  accountType: z.enum(['workcenter', 'member']),
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  sysstatus: z.string(),
  roleNameTh: z.string().optional(),
  roleNameEn: z.string().optional(),
  userst: z.string().optional(),
  plnt: z.string().nullable().optional(),
  wkctr: z.string().optional(),
  fullnameTh: z.string().optional(),
  fullnameEng: z.string().optional(),
  imgMember: z.string().nullable().optional(),
  hasImage: z.boolean().optional(),
  birthdayLabel: z.string().optional(),
  workAgeLabel: z.string().optional(),
  worktimeTotalHours: z.number().optional(),
  worktimeBreakdown: z
    .object({
      wh: z.number(),
      ot1: z.number(),
      ot15: z.number(),
      ot1hol: z.number(),
      ot2: z.number(),
      ot3: z.number(),
      total: z.number(),
    })
    .optional(),
  idcard: z.string().optional(),
  bank: z.string().optional(),
  bankNo: z.string().optional(),
  branch: z.string().optional(),
  lastLogin: z.string().nullable().optional(),
})

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
  workHours: z.number().positive().optional(),
  importWkctr: z.string().optional(),
  ackStatus: z.enum(['pending', 'acknowledged', 'declined']).optional(),
  ackAt: z.string().nullable().optional(),
  ackChannel: z.enum(['telegram', 'web']).nullable().optional(),
})

export const planningResponseSchema = z.object({
  items: z.array(planningItemSchema),
})

export const manhoursResponseSchema = z.object({
  weeks: z.array(
    z.object({
      week: z.string(),
      planned: z.number(),
      actual: z.number(),
      backlog: z.number(),
    }),
  ),
})

export const manhourChartRangeSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  fromDate: z.string(),
  toDate: z.string(),
})

export const manhourChartPerformanceResponseSchema = z.object({
  range: manhourChartRangeSchema,
  profile: z.object({
    idwkctr: z.string(),
    wkctr: z.string(),
    displayName: z.string(),
    position: z.string().nullable(),
    wkctrtype: z.string().nullable(),
    imgmember: z.string().nullable(),
    hasImage: z.boolean(),
  }),
  totalPlannedOrders: z.number(),
  utilizationPercent: z.number(),
  confirmHours: z.number(),
  manhourTotal: z.number(),
  zb: z.array(
    z.object({
      wktype: z.string(),
      planned: z.number(),
      confirmed: z.number(),
      percent: z.number(),
    }),
  ),
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

export type ManhourHrListResponse = z.infer<typeof manhourHrListResponseSchema>

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
  total: z
    .object({
      wh: z.number(),
      ot1: z.number(),
      ot15: z.number(),
      ot1hol: z.number(),
      ot2: z.number(),
      ot3: z.number(),
      total: z.number(),
    })
    .nullable(),
  items: z.array(worktimeDailyItemSchema),
})

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

export type ManhourItem = z.infer<typeof manhourItemSchema>
export type ManhourImportResponse = z.infer<typeof manhourImportResponseSchema>

export const personnelResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      craft: z.string(),
      wc: z.string(),
      confirmStatus: z.enum(['PENDING', 'OK']),
    }),
  ),
})

export const personnelRoleSchema = z.enum([
  'admin',
  'manager',
  'planner',
  'technician',
])

/** Personal Dashboard — สอดคล้องกับ backend/src/schemas/personnel.ts */
export const personnelDashboardProfileSchema = z.object({
  accountType: z.enum(['workcenter', 'member']),
  idwkctr: z.string(),
  username: z.string(),
  displayName: z.string(),
  wkctr: z.string(),
  plnt: z.string().nullable().optional(),
  userst: z.string(),
  userRole: personnelRoleSchema,
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  workGroup: z.string().nullable().optional(),
  workType: z.string().nullable().optional(),
  workLevel: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  tel: z.string().nullable().optional(),
  imgMember: z.string().nullable().optional(),
  birthdayLabel: z.string().nullable().optional(),
  workAgeLabel: z.string().nullable().optional(),
  startWorkDate: z.string().nullable().optional(),
  birthdayDate: z.string().nullable().optional(),
  lastLogin: z.string().nullable().optional(),
})

export const personnelPlanningItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wktype: z.string().nullable(),
  shortText: z.string().nullable(),
  functionalLoc: z.string().nullable(),
  equipment: z.string().nullable(),
  bscStart: z.string().nullable(),
  syst: z.string().nullable(),
})

export const personnelConfirmItemSchema = z.object({
  idclose: z.number().int(),
  idiw37: z.number().int(),
  wkorder: z.string(),
  confirmation: z.string(),
  wkctr: z.string(),
  timewk: z.number(),
  unitc: z.string(),
  stdate: z.string().nullable(),
  endate: z.string().nullable(),
  timeclose: z.string().nullable(),
})

export const personnelWorktimeBreakdownSchema = z.object({
  wh: z.number(),
  ot1: z.number(),
  ot15: z.number(),
  ot1hol: z.number(),
  ot2: z.number(),
  ot3: z.number(),
  total: z.number(),
})

export const personnelTeamMemberSchema = z.object({
  idwkctr: z.string(),
  displayName: z.string(),
  position: z.string().nullable(),
  workGroup: z.string().nullable(),
  openCount: z.number().int(),
  closedCount: z.number().int(),
  totalMinutes: z.number(),
})

export const personnelUnassignedWorkOrderSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wktype: z.string().nullable(),
  shortText: z.string().nullable(),
  equipment: z.string().nullable(),
  functionalLoc: z.string().nullable(),
  bscStart: z.string().nullable(),
  syst: z.string().nullable(),
  wkctr: z.string().nullable(),
})

export const personnelRoleDataSchema = z.object({
  team: z
    .object({
      groupCode: z.string().nullable(),
      groupName: z.string().nullable(),
      totalOpen: z.number().int(),
      totalClose: z.number().int(),
      members: z.array(personnelTeamMemberSchema),
    })
    .nullable()
    .optional(),
  unassigned: z
    .object({
      total: z.number().int(),
      items: z.array(personnelUnassignedWorkOrderSchema),
    })
    .nullable()
    .optional(),
  global: z
    .object({
      openTotal: z.number().int(),
      closeToday: z.number().int(),
      assignedTotal: z.number().int(),
    })
    .nullable()
    .optional(),
})

export const personnelDashboardResponseSchema = z.object({
  role: personnelRoleSchema,
  roleLabel: z.string(),
  profile: personnelDashboardProfileSchema,
  planning: z.object({
    openCount: z.number().int(),
    closedCount: z.number().int(),
    recent: z.array(personnelPlanningItemSchema),
  }),
  confirmation: z.object({
    totalClose: z.number().int(),
    totalMinutes: z.number(),
    recent: z.array(personnelConfirmItemSchema),
  }),
  worktime: personnelWorktimeBreakdownSchema.nullable(),
  roleData: personnelRoleDataSchema,
})

export type PersonnelRole = z.infer<typeof personnelRoleSchema>
export type PersonnelDashboardResponse = z.infer<typeof personnelDashboardResponseSchema>

/** Admin CRUD personnel — แถวสำหรับตาราง/ฟอร์ม */
export const personnelAdminItemSchema = z.object({
  idwkctr: z.string(),
  titlewkctr: z.string().nullable(),
  namewkctr: z.string().nullable(),
  surnamewkctr: z.string().nullable(),
  titlewkctreng: z.string().nullable(),
  namewkctreng: z.string().nullable(),
  surnamewkctreng: z.string().nullable(),
  startwork: z.number().int().nullable(),
  wkctrdate: z.number().int().nullable(),
  iddepartment: z.string().nullable(),
  department: z.string().nullable(),
  idposition: z.string().nullable(),
  position: z.string().nullable(),
  wkctr: z.string(),
  plnt: z.string().nullable(),
  cat: z.string().nullable(),
  resp: z.string().nullable(),
  idwkctrgroup: z.string().nullable(),
  wkctrgroup: z.string().nullable(),
  idwkctrtype: z.string().nullable(),
  wkctrtype: z.string().nullable(),
  idwklevel: z.string().nullable(),
  wklevel: z.string().nullable(),
  wkctrtel: z.string().nullable(),
  wkctrmail: z.string().nullable(),
  labourcost: z.number(),
  userst: z.string(),
  userrole: personnelRoleSchema,
  workstatus: z.string().nullable(),
  imgmember: z.string().nullable(),
  imgmemberMime: z.string(),
  imgmemberBytes: z.number().int(),
  hasImage: z.boolean(),
  passMustChange: z.boolean().optional(),
  telegramChatId: z.string().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  telegramLinkedAt: z.string().nullable().optional(),
})

export const telegramLinkTokenResponseSchema = z.object({
  token: z.string(),
  deepLink: z.string(),
  expiresAt: z.string(),
  botUsername: z.string().nullable(),
  wkctr: z.string(),
  idwkctr: z.string(),
})

export type TelegramLinkTokenResponse = z.infer<typeof telegramLinkTokenResponseSchema>

export const telegramLinkStatusSchema = z.object({
  linked: z.boolean(),
  wkctr: z.string().optional(),
  idwkctr: z.string().optional(),
  telegramChatId: z.string().nullable(),
  telegramUsername: z.string().nullable(),
  telegramLinkedAt: z.string().nullable(),
  botConfigured: z.boolean(),
  botUsername: z.string().nullable(),
})

export type TelegramLinkStatus = z.infer<typeof telegramLinkStatusSchema>

export const adminBulkUserroleBodySchema = z.object({
  idwkctrs: z.array(z.string().min(1)).min(1).max(500),
  userrole: personnelRoleSchema,
})

export const adminBulkUserroleResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.number().int(),
  userrole: personnelRoleSchema,
})

export const adminPhotoGoLiveItemSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  displayName: z.string().nullable(),
  workstatus: z.string().nullable(),
  manhourHours: z.number(),
})

export const adminPhotoGoLiveResponseSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  items: z.array(adminPhotoGoLiveItemSchema),
})

export const adminDeactivateWithoutPhotoResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.number().int(),
  workstatus: z.string(),
  skipped: z.array(z.string()),
})

export type AdminPhotoGoLiveItem = z.infer<typeof adminPhotoGoLiveItemSchema>

export const personnelAdminListResponseSchema = z.object({
  items: z.array(personnelAdminItemSchema),
  totalRows: z.number().int(),
})

export const personnelAdminOkSchema = z.object({
  ok: z.literal(true),
  idwkctr: z.string(),
})

export const personnelImportRowResultSchema = z.object({
  rowNo: z.number().int(),
  idwkctr: z.string(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  message: z.string().optional(),
})

export const personnelImportResponseSchema = z.object({
  fileName: z.string(),
  totalRows: z.number().int(),
  inserted: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  errors: z.number().int(),
  rows: z.array(personnelImportRowResultSchema),
})

export const personnelImageUploadResponseSchema = z.object({
  idwkctr: z.string(),
  imgmember: z.string(),
  mime: z.literal('image/webp'),
  bytes: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
})

export const personnelWorkstatusOptionSchema = z.object({
  workstatus: z.string(),
  wkstatusdes: z.string(),
  wkstcolor: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
})

export const personnelWorkstatusOptionsResponseSchema = z.object({
  items: z.array(personnelWorkstatusOptionSchema),
})

export type PersonnelAdminItem = z.infer<typeof personnelAdminItemSchema>
export type PersonnelImportResponse = z.infer<typeof personnelImportResponseSchema>
export type PersonnelWorkstatusOption = z.infer<typeof personnelWorkstatusOptionSchema>
export type PersonnelImageUploadResponse = z.infer<typeof personnelImageUploadResponseSchema>

/** Personnel Confirmation row (view_countpersonelclose) */
export const personnelConfirmRowSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  mntplan: z.string().nullable(),
  wktype: z.string().nullable(),
  mat: z.string().nullable(),
  equdescrip: z.string().nullable(),
  functionalloc: z.string().nullable(),
  shortText: z.string().nullable(),
  bscStart: z.string().nullable(),
  cday: z.string().nullable(),
  syst: z.string().nullable(),
  systemstatus: z.string().nullable(),
  wkstcolor: z.string().nullable(),
  wkctr: z.string().nullable(),
  plannedCount: z.number().int(),
  closedCount: z.number().int(),
  percentClose: z.number().int(),
  hasConfirm: z.boolean(),
  qcStatus: z.enum(['pending', 'approved', 'rejected']).nullable(),
})

export const confirmQcSnapshotSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).nullable(),
  statusLabel: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  note: z.string().nullable(),
  imageCount: z.number().int(),
  imageBefore: z.number().int(),
  imageAfter: z.number().int(),
  closeCount: z.number().int(),
  worktimeCount: z.number().int(),
  readyForReview: z.boolean(),
  approved: z.boolean(),
})

export const confirmQcPendingItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  wkctr: z.string().nullable(),
  syst: z.string().nullable(),
  systemstatus: z.string().nullable(),
  imageCount: z.number().int(),
  closeCount: z.number().int(),
  submittedAt: z.string().nullable(),
})

export const personnelConfirmListResponseSchema = z.object({
  items: z.array(personnelConfirmRowSchema),
  totalRows: z.number().int(),
  summary: z.object({
    totalOpen: z.number().int(),
    fullyClosed: z.number().int(),
    inProgress: z.number().int(),
    notStarted: z.number().int(),
  }),
})

export type PersonnelConfirmRow = z.infer<typeof personnelConfirmRowSchema>
export type PersonnelConfirmListResponse = z.infer<
  typeof personnelConfirmListResponseSchema
>

export const masterDataItemGenericSchema = z.object({
  id: z.string(),
  code: z.string(),
  nameTh: z.string(),
  plant: z.string(),
  active: z.boolean(),
})

/** Activity type master */
export const activityTypeItemSchema = z.object({
  id: z.string(),
  mat: z.string(),
  matdescrip: z.string(),
  matcheck: z.string(),
})

/** Department master */
export const departmentItemSchema = z.object({
  id: z.string(),
  iddepartment: z.string(),
  department: z.string(),
})

/** Equipment master */
export const equipmentItemSchema = z.object({
  id: z.string(),
  equipment: z.string(),
  equdescrip: z.string(),
  equipmentsub: z.string(),
  functionalloc: z.string(),
  equl: z.string(),
  equ1: z.string(),
  equea: z.string(),
})

/** Functional location master */
export const functionalItemSchema = z.object({
  id: z.string(),
  functionalloc: z.string(),
  funldescrip: z.string(),
  functionallocsub: z.string(),
})

export const reasonItemSchema = z.object({
  id: z.string(),
  reasoncode: z.string(),
  reasonname: z.string(),
})

export const workStatusItemSchema = z.object({
  id: z.string(),
  syst: z.string(),
  wkstreason: z.string(),
  wkstcolor: z.string(),
})

export const workTypeItemSchema = z.object({
  id: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

export const zbItemSchema = z.object({
  id: z.string(),
  wkzb: z.string(),
  zbdescrip: z.string(),
})

export const lineProductItemSchema = z.object({
  id: z.string(),
  productline: z.string(),
  prolinedescrip: z.string(),
})

export const zoneItemSchema = z.object({
  id: z.string(),
  idzone: z.string(),
  zone: z.string(),
  zonedescrip: z.string(),
  idproductline: z.string(),
  productline: z.string(),
})

export const machineItemSchema = z.object({
  id: z.string(),
  machine: z.string(),
  idzone: z.string(),
  zone: z.string(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
})

export const materialItemSchema = z.object({
  id: z.string(),
  idmaterial: z.number(),
  wkorder: z.string(),
  matdoc: z.string(),
  entrydate: z.string(),
  matpo: z.string(),
  pstngdate: z.string(),
  docdate: z.string(),
  materialdesc: z.string(),
  matquantity: z.number(),
  matbun: z.string(),
  amountinlc: z.number(),
  crcy: z.string(),
  mvt: z.string(),
  costctr: z.string(),
  mattime: z.string(),
  matyr: z.string(),
  material: z.string(),
})

export const levelItemSchema = z.object({
  id: z.string(),
  idwklevel: z.string(),
  wklevel: z.string(),
})

export const positionItemSchema = z.object({
  id: z.string(),
  idposition: z.string(),
  position: z.string(),
})

export const groupItemSchema = z.object({
  id: z.string(),
  idwkctrgroup: z.number(),
  wkctrgroup: z.string(),
  wkctrdescription: z.string(),
})

export const tasklistItemSchema = z.object({
  id: z.string(),
  idtasklist: z.number(),
  idwkctrtype: z.string(),
  wkctrtype: z.string(),
  idzone: z.string(),
  zone: z.string(),
  idmachine: z.string(),
  mntplan: z.string(),
  tasklist: z.string(),
  legacy: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  pmday: z.number(),
  machinestatus: z.number(),
  pmmin: z.number(),
  pmman: z.number(),
  manhour: z.number(),
  mat: z.string(),
  runhr: z.number(),
  mpoint: z.string(),
  bcprunhr: z.number(),
  gls: z.string(),
  ment: z.string(),
  freqhour: z.number(),
  plan: z.string(),
})

export const lineSchdulItemSchema = z.object({
  id: z.string(),
  idline: z.number(),
  idproductline: z.string(),
  productline: z.string(),
  lineday: z.number(),
  uptime: z.number(),
  linereason: z.string(),
})

export type MasterDataItemGeneric = z.infer<typeof masterDataItemGenericSchema>
export type ActivityTypeItem = z.infer<typeof activityTypeItemSchema>
export type DepartmentItem = z.infer<typeof departmentItemSchema>
export type EquipmentItem = z.infer<typeof equipmentItemSchema>
export type FunctionalItem = z.infer<typeof functionalItemSchema>
export type ReasonItem = z.infer<typeof reasonItemSchema>
export type WorkStatusItem = z.infer<typeof workStatusItemSchema>
export type WorkTypeItem = z.infer<typeof workTypeItemSchema>
export type ZbItem = z.infer<typeof zbItemSchema>
export type LineProductItem = z.infer<typeof lineProductItemSchema>
export type ZoneItem = z.infer<typeof zoneItemSchema>
export type MachineItem = z.infer<typeof machineItemSchema>
export type MaterialItem = z.infer<typeof materialItemSchema>
export type LevelItem = z.infer<typeof levelItemSchema>
export type PositionItem = z.infer<typeof positionItemSchema>
export type GroupItem = z.infer<typeof groupItemSchema>
export type TasklistItem = z.infer<typeof tasklistItemSchema>
export type LineSchdulItem = z.infer<typeof lineSchdulItemSchema>
export type MasterDataItem =
  | MasterDataItemGeneric
  | ActivityTypeItem
  | DepartmentItem
  | EquipmentItem
  | FunctionalItem
  | ReasonItem
  | WorkStatusItem
  | WorkTypeItem
  | ZbItem
  | LineProductItem
  | ZoneItem
  | MachineItem
  | MaterialItem
  | LevelItem
  | PositionItem
  | GroupItem
  | TasklistItem
  | LineSchdulItem

export function isActivityTypeItem(item: MasterDataItem): item is ActivityTypeItem {
  return 'mat' in item && 'matdescrip' in item
}

export const masterDataResponseSchema = z.object({
  entity: z.string(),
  items: z.array(
    z.union([
      activityTypeItemSchema,
      departmentItemSchema,
      equipmentItemSchema,
      functionalItemSchema,
      reasonItemSchema,
      workStatusItemSchema,
      workTypeItemSchema,
      zbItemSchema,
      lineProductItemSchema,
      zoneItemSchema,
      machineItemSchema,
      materialItemSchema,
      levelItemSchema,
      positionItemSchema,
      groupItemSchema,
      tasklistItemSchema,
      lineSchdulItemSchema,
      masterDataItemGenericSchema,
    ]),
  ),
})

export const masterDataMetaResponseSchema = z.object({
  entity: z.string(),
  count: z.number().int(),
  lastUpdatedAt: z.string().nullable(),
})

export const reportsRangeSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  fromDate: z.string(),
  toDate: z.string(),
})

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

export type WeekToWeekRow = z.infer<typeof weekToWeekRowSchema>

export const kpiResponseSchema = z.object({
  range: reportsRangeSchema,
  utilization: z.array(z.number()),
  backlogHours: z.array(z.number()),
  labels: z.array(z.string()),
  weekToWeek: z.array(weekToWeekRowSchema),
})

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
  status: z.enum(['ok', 'denied', 'error']),
  message: z.string().nullable(),
  createdAt: z.string(),
})

export type ActivityLogItem = z.infer<typeof activityLogItemSchema>

export const activityLogListResponseSchema = z.object({
  items: z.array(activityLogItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export const summaryWeeklyUtilizationBarSchema = z.object({
  idwkctr: z.string(),
  wkctr: z.string(),
  summaryHours: z.number(),
})

export type SummaryWeeklyUtilizationBar = z.infer<typeof summaryWeeklyUtilizationBarSchema>

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

export type SummaryWeeklyRow = z.infer<typeof summaryWeeklyRowSchema>

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

export type ReportsImportCoverage = z.infer<typeof reportsImportCoverageSchema>

export const summaryWeeklyResponseSchema = z.object({
  range: reportsRangeSchema,
  utilizationChart: z.array(summaryWeeklyUtilizationBarSchema),
  rows: z.array(summaryWeeklyRowSchema),
  importCoverage: reportsImportCoverageSchema,
})

export const themeModeSchema = z.enum(['light', 'dark', 'system'])

export const navShellModeSchema = z.enum(['sidebar', 'navbar', 'hamburger'])

export type NavShellMode = z.infer<typeof navShellModeSchema>

export const publicSettingsResponseSchema = z.object({
  appName: z.string(),
  footerText: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  successColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  infoColor: z.string(),
  themeMode: themeModeSchema,
  navShellMode: navShellModeSchema,
  logoMime: z.string().nullable(),
  hasLogo: z.boolean(),
  hasFavicon: z.boolean(),
  hasLoginBackground: z.boolean(),
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string(),
  }),
  featureIndexeddbOffline: z.boolean(),
  featureDashboardCharts: z.boolean(),
  fontFamily: z.enum(['system', 'macos', 'sarabun', 'noto-sans-thai', 'inter', 'ibm-plex-sans-thai']),
  fontSizePreset: z.enum(['compact', 'comfortable', 'large']),
  fontSizeBasePx: z.number().int().min(12).max(22).nullable(),
  fontColor: z.string().nullable(),
  fontHeadingColor: z.string().nullable(),
  fontMutedColor: z.string().nullable(),
  logoNavHeightPx: z.number().int(),
  logoLoginHeightPx: z.number().int(),
  faviconSizePx: z.number().int(),
})

export type PublicSettings = z.infer<typeof publicSettingsResponseSchema>

export const adminBrandingResponseSchema = z.object({
  appName: z.string(),
  footerText: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  successColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  infoColor: z.string(),
  themeMode: themeModeSchema,
  logoMime: z.string().nullable(),
  hasLogo: z.boolean(),
  hasFavicon: z.boolean(),
  hasLoginBackground: z.boolean(),
  fontFamily: z.enum(['system', 'macos', 'sarabun', 'noto-sans-thai', 'inter', 'ibm-plex-sans-thai']),
  fontSizePreset: z.enum(['compact', 'comfortable', 'large']),
  fontSizeBasePx: z.number().int().min(12).max(22).nullable(),
  fontColor: z.string().nullable(),
  fontHeadingColor: z.string().nullable(),
  fontMutedColor: z.string().nullable(),
  logoNavHeightPx: z.number().int(),
  logoLoginHeightPx: z.number().int(),
  faviconSizePx: z.number().int(),
})

export type AdminBranding = z.infer<typeof adminBrandingResponseSchema>

export const patchAdminBrandingBodySchema = z.object({
  appName: z.string().trim().min(1).max(120).optional(),
  footerText: z.string().trim().max(500).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  successColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  warningColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  dangerColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  infoColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  themeMode: themeModeSchema.optional(),
  fontFamily: z
    .enum(['system', 'macos', 'sarabun', 'noto-sans-thai', 'inter', 'ibm-plex-sans-thai'])
    .optional(),
  fontSizePreset: z.enum(['compact', 'comfortable', 'large']).optional(),
  fontSizeBasePx: z.number().int().min(12).max(22).nullable().optional(),
  fontColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  fontHeadingColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  fontMutedColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  logoNavHeightPx: z.number().int().min(24).max(72).optional(),
  logoLoginHeightPx: z.number().int().min(40).max(128).optional(),
  faviconSizePx: z.number().int().min(16).max(48).optional(),
})

export type PatchAdminBrandingBody = z.infer<typeof patchAdminBrandingBodySchema>

export const localeSchema = z.enum(['th-TH', 'en-US'])
export const yearFormatSchema = z.enum(['BE', 'AD'])
export const dateFormatSchema = z.enum(['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd'])

export const settingsResetSectionSchema = z.enum(['locale', 'limits', 'features', 'maintenance'])

export type SettingsResetSection = z.infer<typeof settingsResetSectionSchema>

export const adminSettingsResponseSchema = z.object({
  locale: localeSchema,
  timezone: z.string(),
  yearFormat: yearFormatSchema,
  dateFormat: dateFormatSchema,
  uploadMaxMb: z.number().int(),
  sessionTtlMin: z.number().int(),
  passwordMinLength: z.number().int(),
  maxLoginAttempts: z.number().int(),
  featureIndexeddbOffline: z.boolean(),
  featureDashboardCharts: z.boolean(),
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string(),
})

export type AdminSettings = z.infer<typeof adminSettingsResponseSchema>

export const patchAdminSettingsBodySchema = z.object({
  locale: localeSchema.optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  yearFormat: yearFormatSchema.optional(),
  dateFormat: dateFormatSchema.optional(),
  uploadMaxMb: z.number().int().min(1).max(500).optional(),
  sessionTtlMin: z.number().int().min(15).max(1440).optional(),
  passwordMinLength: z.number().int().min(8).max(128).optional(),
  maxLoginAttempts: z.number().int().min(3).max(50).optional(),
  featureIndexeddbOffline: z.boolean().optional(),
  featureDashboardCharts: z.boolean().optional(),
  maintenanceEnabled: z.boolean().optional(),
  maintenanceMessage: z.string().max(2000).optional(),
})

export type PatchAdminSettingsBody = z.infer<typeof patchAdminSettingsBodySchema>

export const adminSecretSettingSchema = z.object({
  settingKey: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  hasValue: z.boolean(),
  maskedValue: z.string(),
})

export const adminSecretSettingsResponseSchema = z.object({
  items: z.array(adminSecretSettingSchema),
})

export const auditStatusSchema = z.enum(['ok', 'denied', 'error'])

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

export const auditHubResponseSchema = z.object({
  retentionDays: z.number().int(),
  retentionCutoffDate: z.string(),
  range: z.object({ from: z.string(), to: z.string() }),
  totals: z.object({
    events: z.number().int(),
    denied: z.number().int(),
    imports: z.number().int(),
    planning: z.number().int(),
    confirmations: z.number().int(),
    workOrders: z.number().int(),
  }),
  byPrefix: z.array(
    z.object({
      prefix: z.string(),
      label: z.string(),
      count: z.number().int(),
    }),
  ),
  planWo: z.object({
    year: z.number().int(),
    month: z.number().int(),
    monthLabel: z.string(),
    totalWo: z.number().int(),
    pmWo: z.number().int(),
    reactiveWo: z.number().int(),
    openWo: z.number().int(),
    assignedWo: z.number().int(),
    movedWo: z.number().int(),
  }),
  recentRevisions: z.array(
    z.object({
      id: z.string(),
      revisionNo: z.number().int(),
      changeKind: z.string(),
      changeLabel: z.string(),
      summary: z.string(),
      workOrder: z.string().nullable(),
      jobDetail: z.string().nullable(),
      actorId: z.string().nullable(),
      actorRole: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
})

export type AuditHubRevisionItem = z.infer<
  typeof auditHubResponseSchema
>['recentRevisions'][number]

export type AuditHubResponse = z.infer<typeof auditHubResponseSchema>

export const auditDeleteResponseSchema = z.object({
  ok: z.literal(true),
  deleted: z.number().int(),
})

export type AuditFilters = {
  from?: string
  to?: string
  actorId?: string
  actionPrefix?: string[]
  resource?: string
  status?: 'ok' | 'denied' | 'error' | 'all'
  q?: string
}

export const healthStatusSchema = z.enum(['ok', 'warning', 'error', 'unknown'])

export const adminHealthResponseSchema = z.object({
  time: z.string(),
  service: z.string(),
  version: z.string(),
  db: z.object({
    status: healthStatusSchema,
    latencyMs: z.number().nullable(),
    pool: z.object({
      total: z.number().int(),
      idle: z.number().int(),
      waiting: z.number().int(),
    }),
    message: z.string().nullable().optional(),
  }),
  disk: z.object({
    status: healthStatusSchema,
    path: z.string(),
    totalBytes: z.number().nullable(),
    freeBytes: z.number().nullable(),
    usedBytes: z.number().nullable(),
    usedPercent: z.number().nullable(),
    message: z.string().nullable().optional(),
  }),
  process: z.object({
    status: healthStatusSchema,
    nodeVersion: z.string(),
    platform: z.string(),
    uptimeSec: z.number(),
    memoryRssMb: z.number(),
    memoryHeapUsedMb: z.number(),
  }),
  migration: z.object({
    status: healthStatusSchema,
    migrationsDir: z.string().nullable(),
    totalFiles: z.number().int(),
    appliedCount: z.number().int(),
    pendingCount: z.number().int(),
    unverifiedCount: z.number().int(),
    latestAppliedId: z.string().nullable(),
    latestFile: z.string().nullable(),
    probes: z.array(
      z.object({
        id: z.string(),
        file: z.string(),
        label: z.string(),
        status: z.enum(['applied', 'pending', 'unverified']),
      }),
    ),
  }),
})

export type AdminHealthResponse = z.infer<typeof adminHealthResponseSchema>

export const healthErrorLogItemSchema = z.object({
  id: z.number(),
  actorId: z.string().nullable(),
  action: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.string(),
})

export const healthErrorLogResponseSchema = z.object({
  items: z.array(healthErrorLogItemSchema),
})

export type HealthErrorLogItem = z.infer<typeof healthErrorLogItemSchema>

export const slowApiMetricSchema = z.object({
  route: z.string(),
  count: z.number().int(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  maxMs: z.number(),
})

export type SlowApiMetric = z.infer<typeof slowApiMetricSchema>

export const healthSlowApiResponseSchema = z.object({
  thresholdMs: z.number().int(),
  items: z.array(slowApiMetricSchema),
})

export const healthMigrateResultSchema = z.object({
  applied: z.array(
    z.object({
      id: z.string(),
      file: z.string(),
      label: z.string(),
    }),
  ),
  pendingRemaining: z.number().int(),
  stoppedAt: z
    .object({
      file: z.string(),
      message: z.string(),
    })
    .nullable(),
})

export type HealthMigrateResult = z.infer<typeof healthMigrateResultSchema>

export const adminRoleSchema = z.object({
  roleCode: z.string(),
  roleName: z.string(),
  roleNameEn: z.string(),
  roleColor: z.string(),
  isSystem: z.boolean(),
  description: z.string().nullable(),
  userCount: z.number().int(),
  permissionCount: z.number().int(),
})

export type AdminRole = z.infer<typeof adminRoleSchema>

export const adminRolesListResponseSchema = z.object({
  items: z.array(adminRoleSchema),
})

export const adminRoleMatrixResponseSchema = z.object({
  roles: z.array(adminRoleSchema),
  groups: z.array(
    z.object({
      group: z.string(),
      permissions: z.array(
        z.object({
          permCode: z.string(),
          permGroup: z.string(),
          permName: z.string(),
          description: z.string().nullable(),
          grants: z.record(z.string(), z.boolean()),
        }),
      ),
    }),
  ),
})

export type AdminRoleMatrixResponse = z.infer<typeof adminRoleMatrixResponseSchema>

export const createAdminRoleBodySchema = z.object({
  roleCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]{0,15}$/),
  roleName: z.string().trim().min(1).max(120),
  roleNameEn: z.string().trim().min(1).max(120),
  roleColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#4DA6FF'),
  description: z.string().max(500).nullable().optional(),
})

export const updateAdminRoleBodySchema = z.object({
  roleName: z.string().trim().min(1).max(120).optional(),
  roleNameEn: z.string().trim().min(1).max(120).optional(),
  roleColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(500).nullable().optional(),
})

export const simulateRoleResponseSchema = z.object({
  roleCode: z.string(),
  permissions: z.array(z.string()),
})

export const roleOkSchema = z.object({ ok: z.literal(true) })

export type CreateAdminRoleBody = z.infer<typeof createAdminRoleBodySchema>
export type UpdateAdminRoleBody = z.infer<typeof updateAdminRoleBodySchema>

export const menuKindSchema = z.enum(['heading', 'item'])

export const adminMenuRowSchema = z.object({
  idmenu: z.number().int(),
  idmenusub: z.string(),
  menuon: z.number().int(),
  menuKind: menuKindSchema,
  menuright: z.string(),
  menuicon: z.string().nullable(),
  menutitle: z.string(),
  menulink: z.string().nullable(),
  reactRoute: z.string().nullable(),
  menuname: z.string().nullable(),
  menulavel: z.number().int(),
  endExact: z.boolean(),
})

export type AdminMenuRow = z.infer<typeof adminMenuRowSchema>

export const adminMenuListResponseSchema = z.object({
  items: z.array(adminMenuRowSchema),
})

export const createAdminMenuBodySchema = z.object({
  menuKind: menuKindSchema,
  menutitle: z.string().trim().min(1).max(200),
  menuright: z.string().trim().min(1).max(32),
  menuicon: z.string().max(64).nullable().optional(),
  menulink: z.string().max(500).nullable().optional(),
  reactRoute: z.string().max(200).nullable().optional(),
  menuname: z.string().max(64).nullable().optional(),
  idmenusub: z.string().max(16).optional(),
  menulavel: z.number().int().min(0).max(9).optional(),
  endExact: z.boolean().optional(),
  menuon: z.number().int().optional(),
})

export const updateAdminMenuBodySchema = createAdminMenuBodySchema.partial()

export type CreateAdminMenuBody = z.infer<typeof createAdminMenuBodySchema>
export type UpdateAdminMenuBody = z.infer<typeof updateAdminMenuBodySchema>

export const menuOkSchema = z.object({ ok: z.literal(true) })

export const usersResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      username: z.string(),
      role: z.string(),
      active: z.boolean(),
    }),
  ),
})

export const userLogItemSchema = z.object({
  id: z.coerce.number(),
  actionTime: z.string(),
  action: z.string(),
  userIp: z.string().nullable(),
  myIp: z.string().nullable(),
})

export const userLogResponseSchema = z.object({
  items: z.array(userLogItemSchema),
})

export const workcenterItemSchema = z.object({
  wkctr: z.string(),
  displayName: z.string(),
})

export const workcentersResponseSchema = z.object({
  items: z.array(workcenterItemSchema),
})

export const confirmationCloseItemSchema = z.object({
  idclose: z.number(),
  idiw37: z.number(),
  wkctr: z.string(),
  displayName: z.string(),
  stdate: z.number(),
  endate: z.number(),
  timewk: z.number(),
  unitc: z.string(),
})

export const confirmationByWorkOrderResponseSchema = z.object({
  idiw37: z.number(),
  wkorder: z.string(),
  items: z.array(confirmationCloseItemSchema),
})

export const personnelCloseItemSchema = z.object({
  idwrkclose: z.number(),
  idiw37: z.number(),
  wkctr: z.string(),
  displayName: z.string(),
  cstdate: z.number(),
  cendate: z.number(),
  wktimewk: z.number(),
  wkunit: z.string(),
})

export const personnelClosesResponseSchema = z.object({
  items: z.array(personnelCloseItemSchema),
})

export const confirmationCommentItemSchema = z.object({
  idcom: z.number(),
  idiw37: z.number(),
  comdetail: z.string(),
  wkctr: z.string(),
  createdAt: z.string(),
})

export const confirmationCommentsResponseSchema = z.object({
  items: z.array(confirmationCommentItemSchema),
})

export const confirmationCommentBodySchema = z.object({
  comdetail: z.string().min(1),
})

export const confirmationCommentResponseSchema = z.object({
  item: confirmationCommentItemSchema,
})

export const confirmationImagePhaseSchema = z.enum(['before', 'after'])

export const confirmationImageItemSchema = z.object({
  idcimg: z.number(),
  idiw37: z.number(),
  fileName: z.string(),
  originalName: z.string(),
  mime: z.string(),
  bytes: z.number(),
  wkctr: z.string(),
  phase: z.union([confirmationImagePhaseSchema, z.literal('')]),
  comment: z.string(),
  createdAt: z.string(),
})

export const confirmationImagesResponseSchema = z.object({
  items: z.array(confirmationImageItemSchema),
})

export const confirmationImageDataResponseSchema = z.object({
  idcimg: z.number(),
  mime: z.string(),
  base64: z.string(),
})

export const confirmationImportRowResultSchema = z.object({
  rowNo: z.number().int(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  confirmation: z.string(),
  wkorder: z.string(),
  wkctr: z.string(),
  stdate: z.number().nullable(),
  endate: z.number().nullable(),
  timewk: z.number().nullable(),
  message: z.string(),
})

export const confirmationImportResponseSchema = z.object({
  fileName: z.string(),
  totalRows: z.number().int(),
  inserted: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  errors: z.number().int(),
  rows: z.array(confirmationImportRowResultSchema),
})

export const confirmationImportPreviewResponseSchema = confirmationImportResponseSchema.extend({
  preview: z.literal(true),
  layout: z.enum(['legacy', 'sap_alv']),
  parseOk: z.number().int(),
  matchWoInDb: z.number().int(),
})

export type ConfirmationImportPreviewResponse = z.infer<typeof confirmationImportPreviewResponseSchema>

export type ConfirmationImportRowResult = z.infer<typeof confirmationImportRowResultSchema>
export type ConfirmationImportResponse = z.infer<typeof confirmationImportResponseSchema>

export const MASS_CONFIRM_MAX_ITEMS = 44

export const confirmationMassCloseBodySchema = z.object({
  idiw37n: z.array(z.coerce.number().int().positive()).min(1).max(MASS_CONFIRM_MAX_ITEMS),
  wkctr: z.string().min(1),
  startD: z.string().min(1),
  startT: z.string().min(1),
  endD: z.string().min(1),
  endT: z.string().min(1),
})

export const confirmationMassCloseResponseSchema = z.object({
  ok: z.literal(true),
  succeeded: z.array(z.number().int()),
  failed: z.array(
    z.object({
      idiw37: z.number().int(),
      message: z.string(),
    }),
  ),
  maxItems: z.literal(MASS_CONFIRM_MAX_ITEMS),
})

export const massConfirmExportItemSchema = z.object({
  idiw37: z.number().int(),
  wkorder: z.string(),
  qcStatus: z.enum(['pending', 'approved', 'rejected']).nullable(),
  hasConfirm: z.boolean(),
  exportable: z.boolean(),
})

export const massConfirmExportSummarySchema = z.object({
  total: z.number().int(),
  complete: z.boolean(),
  hasConfirm: z.number().int(),
  qcApproved: z.number().int(),
  qcPending: z.number().int(),
  qcRejected: z.number().int(),
  exportable: z.number().int(),
  items: z.array(massConfirmExportItemSchema),
})

export type MassConfirmExportSummary = z.infer<typeof massConfirmExportSummarySchema>

export const qcApproveBatchResponseSchema = z.object({
  approved: z.array(z.number().int()),
  skipped: z.array(
    z.object({
      idiw37: z.number().int(),
      wkorder: z.string(),
      reason: z.string(),
    }),
  ),
})

export const confirmationExportRowSchema = z.object({
  no: z.number().int(),
  confirmation: z.string(),
  wkorder: z.string(),
  opac: z.string(),
  subO: z.string(),
  ca: z.string(),
  split: z.string(),
  wkctr: z.string(),
  timewk: z.number(),
  unitc: z.string(),
  startDateExe: z.string(),
  endDateExe: z.string(),
  startExecute: z.string(),
  endExecute: z.string(),
})

export const confirmationExportResponseSchema = z.object({
  scope: z.enum(['ALL', 'OWN']),
  actorWkctr: z.string(),
  totalRows: z.number().int(),
  items: z.array(confirmationExportRowSchema),
})

export const confirmationPreviewRowSchema = confirmationExportRowSchema.extend({
  idiw37: z.number().int(),
  confirmQcStatus: z.enum(['pending', 'rejected']),
  source: z.enum(['personnel', 'supervisor']),
})

export const confirmationPreviewResponseSchema = z.object({
  totalRows: z.number().int(),
  items: z.array(confirmationPreviewRowSchema),
})

export type ConfirmationExportRow = z.infer<typeof confirmationExportRowSchema>
export type ConfirmationPreviewRow = z.infer<typeof confirmationPreviewRowSchema>
export type ConfirmationExportResponse = z.infer<typeof confirmationExportResponseSchema>

export const backupTriggerSchema = z.enum(['manual', 'schedule'])
export const backupStatusSchema = z.enum(['running', 'success', 'failed'])

export const backupHistoryItemSchema = z.object({
  id: z.number(),
  trigger: backupTriggerSchema,
  status: backupStatusSchema,
  sizeBytes: z.number().nullable(),
  filePath: z.string().nullable(),
  sha256: z.string().nullable(),
  durationMs: z.number().nullable(),
  startedBy: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  errorText: z.string().nullable(),
})

export type BackupHistoryItem = z.infer<typeof backupHistoryItemSchema>

export const backupListResponseSchema = z.object({
  items: z.array(backupHistoryItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})

export type BackupListResponse = z.infer<typeof backupListResponseSchema>

export const backupScheduleResponseSchema = z.object({
  scheduleCron: z.string(),
  retentionDays: z.number().int(),
  targetDir: z.string(),
  pgDumpAvailable: z.boolean(),
  psqlAvailable: z.boolean(),
  pgDumpBin: z.string(),
  psqlBin: z.string(),
  lastSuccess: backupHistoryItemSchema.nullable().optional(),
})

export type BackupScheduleResponse = z.infer<typeof backupScheduleResponseSchema>

export const patchBackupScheduleBodySchema = z.object({
  scheduleCron: z.string().trim().min(9).max(64).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
  targetDir: z.string().trim().min(3).max(500).optional(),
})

export type PatchBackupScheduleBody = z.infer<typeof patchBackupScheduleBodySchema>

export const startBackupResponseSchema = z.object({
  item: backupHistoryItemSchema,
})

export const restoreBackupResponseSchema = z.object({
  ok: z.literal(true),
  durationMs: z.number().int(),
  source: z.enum(['upload', 'history']),
  backupId: z.number().optional(),
})

export type RestoreBackupResponse = z.infer<typeof restoreBackupResponseSchema>

export const announcementLevelSchema = z.enum(['info', 'warn', 'error', 'maintenance'])

export const announcementItemSchema = z.object({
  id: z.number(),
  level: announcementLevelSchema,
  title: z.string(),
  body: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  dismissable: z.boolean(),
  active: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})

export type AnnouncementItem = z.infer<typeof announcementItemSchema>

export const announcementListResponseSchema = z.object({
  items: z.array(announcementItemSchema),
})

export type AnnouncementListResponse = z.infer<typeof announcementListResponseSchema>

export const activeAnnouncementsResponseSchema = z.object({
  items: z.array(
    announcementItemSchema.pick({
      id: true,
      level: true,
      title: true,
      body: true,
      startsAt: true,
      endsAt: true,
      dismissable: true,
    }),
  ),
})

export type ActiveAnnouncement = z.infer<
  typeof activeAnnouncementsResponseSchema
>['items'][number]

export const createAnnouncementBodySchema = z.object({
  level: announcementLevelSchema.optional(),
  title: z.string().trim().min(1).max(500),
  body: z.string().max(10000).optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
  dismissable: z.boolean().optional(),
  active: z.boolean().optional(),
})

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBodySchema>

export const patchAnnouncementBodySchema = createAnnouncementBodySchema.partial()

export type PatchAnnouncementBody = z.infer<typeof patchAnnouncementBodySchema>

export const failedLoginDaySchema = z.object({
  date: z.string(),
  count: z.number().int(),
})

export const securityOverviewResponseSchema = z.object({
  failedLogin: z.object({
    days: z.number().int(),
    total: z.number().int(),
    series: z.array(failedLoginDaySchema),
  }),
  denied: z.object({
    items: z.array(auditLogItemSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  }),
  rateLimitedIps: z.array(
    z.object({
      ip: z.string(),
      hits: z.number().int(),
      lastAt: z.string(),
    }),
  ),
  rateLimitHits: z.number().int(),
  suspiciousIps: z.array(
    z.object({
      ip: z.string(),
      hits: z.number().int(),
      lastAt: z.string(),
    }),
  ),
  blockedIps: z.object({
    items: z.array(
      z.object({
        id: z.number().int(),
        ip: z.string(),
        reason: z.string().nullable(),
        blockedBy: z.string(),
        createdAt: z.string(),
        expiresAt: z.string().nullable(),
      }),
    ),
  }),
  rateLimitNote: z.string(),
})

export type SecurityOverviewResponse = z.infer<typeof securityOverviewResponseSchema>

export const blockedIpItemSchema = z.object({
  id: z.number().int(),
  ip: z.string(),
  reason: z.string().nullable(),
  blockedBy: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})

export type BlockedIpItem = z.infer<typeof blockedIpItemSchema>

export const createBlockedIpBodySchema = z.object({
  ip: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export type CreateBlockedIpBody = z.infer<typeof createBlockedIpBodySchema>

export const adminAboutResponseSchema = z.object({
  time: z.string(),
  apiVersion: z.string(),
  webVersion: z.string(),
  buildCommit: z.string().nullable(),
  buildTime: z.string().nullable(),
  vendor: z.string(),
  client: z.string(),
  license: z.object({
    status: z.string(),
    expiresAt: z.string().nullable(),
  }),
  server: z.object({
    platform: z.string(),
    platformLabel: z.string(),
    nodeVersion: z.string(),
    uptimeSec: z.number(),
    disk: adminHealthResponseSchema.shape.disk,
  }),
  migration: z.object({
    status: healthStatusSchema,
    totalFiles: z.number().int(),
    appliedCount: z.number().int(),
    pendingCount: z.number().int(),
    unverifiedCount: z.number().int(),
    latestAppliedId: z.string().nullable(),
    latestFile: z.string().nullable(),
  }),
})

export type AdminAboutResponse = z.infer<typeof adminAboutResponseSchema>

export const themeModePrefSchema = z.enum(['light', 'dark', 'system'])
export const densityPrefSchema = z.enum(['comfortable', 'compact'])

export const userPrefSchema = z.object({
  userId: z.string(),
  themeMode: themeModePrefSchema.nullable(),
  language: z.string().nullable(),
  density: densityPrefSchema.nullable(),
  seenTours: z.record(z.string(), z.boolean()),
  updatedAt: z.string(),
})

export type UserPref = z.infer<typeof userPrefSchema>

export const patchUserPrefBodySchema = z.object({
  themeMode: themeModePrefSchema.optional(),
  language: z.string().trim().max(16).optional().nullable(),
  density: densityPrefSchema.optional(),
  seenTours: z.record(z.string(), z.boolean()).optional(),
})

export type PatchUserPrefBody = z.infer<typeof patchUserPrefBodySchema>

export const appNotificationItemSchema = z.object({
  id: z.number().int().positive(),
  notifyKind: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  linkRoute: z.string().nullable(),
  idiw37: z.number().int().positive().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
})

export const appNotificationsResponseSchema = z.object({
  items: z.array(appNotificationItemSchema),
  unreadCount: z.number().int().nonnegative(),
})

export type AppNotificationsResponse = z.infer<typeof appNotificationsResponseSchema>

export const telegramNotifyKindSchema = z.enum([
  'assignment_to_tech',
  'ack_to_planner',
  'close_to_planner',
  'ack_summary',
  'confirm_reminder',
  'custom',
])

export type TelegramNotifyKind = z.infer<typeof telegramNotifyKindSchema>

export const telegramLinkTypeSchema = z.enum(['none', 'wkctrgroup', 'pm_team', 'workcenters'])

export type TelegramLinkType = z.infer<typeof telegramLinkTypeSchema>

export const telegramGroupItemSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  notifyKind: telegramNotifyKindSchema,
  linkType: telegramLinkTypeSchema,
  linkRef: z.string().nullable(),
  telegramChatId: z.string().nullable(),
  enabled: z.boolean(),
  note: z.string().nullable(),
  memberWkctrs: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TelegramGroupItem = z.infer<typeof telegramGroupItemSchema>

export const telegramGroupListResponseSchema = z.object({
  items: z.array(telegramGroupItemSchema),
})

export const createTelegramGroupBodySchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1),
  notifyKind: telegramNotifyKindSchema,
  linkType: telegramLinkTypeSchema.optional(),
  linkRef: z.string().trim().max(64).nullable().optional(),
  telegramChatId: z.union([z.string(), z.number()]).nullable().optional(),
  enabled: z.boolean().optional(),
  note: z.string().trim().nullable().optional(),
  memberWkctrs: z.array(z.string().trim().min(1)).optional(),
})

export type CreateTelegramGroupBody = z.infer<typeof createTelegramGroupBodySchema>

export const patchTelegramGroupBodySchema = createTelegramGroupBodySchema.partial()

export type PatchTelegramGroupBody = z.infer<typeof patchTelegramGroupBodySchema>

export const telegramSummaryResponseSchema = z.object({
  botConfigured: z.boolean(),
  notifyEnabled: z.boolean(),
  totalGroups: z.number().int().nonnegative(),
  enabledGroups: z.number().int().nonnegative(),
  linkedTechnicians: z.number().int().nonnegative(),
  activeTechnicians: z.number().int().nonnegative(),
  wkctrGroups: z.array(
    z.object({
      code: z.string(),
      description: z.string().nullable(),
    }),
  ),
  pmTeams: z.array(z.string()),
})

export type TelegramSummaryResponse = z.infer<typeof telegramSummaryResponseSchema>

export const telegramLinkStatusResponseSchema = z.object({
  linked: z.number().int().nonnegative(),
  unlinked: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      wkctr: z.string(),
      displayName: z.string().nullable(),
      telegramChatId: z.string().nullable(),
      telegramUsername: z.string().nullable(),
      telegramLinkedAt: z.string().nullable(),
    }),
  ),
})

export type TelegramLinkStatusResponse = z.infer<typeof telegramLinkStatusResponseSchema>

export const telegramTestSendResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
})
