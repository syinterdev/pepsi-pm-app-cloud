import { z } from 'zod'
import { pmDataReadinessSchema } from '../lib/pm-data-readiness.js'
import { woPmFormHeaderSchema } from '../lib/wo-pm-form-header.js'
import { pmPlanTeamFieldSchema } from '../lib/pm-plan-team.js'
import { woPmPhaseSchema } from '../lib/wo-pm-phase.js'
import { SAP_MASS_CONFIRM_MAX } from '../lib/mass-confirm-limit.js'
import { woPmExecutionSchema, woPmPage2FormSchema } from './pm-execution.js'

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

export const workOrderOperationSchema = z.object({
  no: z.string(),
  desc: z.string(),
  wc: z.string(),
  hours: z.number(),
})

export const workOrderComponentSchema = z.object({
  material: z.string(),
  qty: z.number(),
  unit: z.string(),
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
    pmPhase: z.enum(woPmPhaseSchema),
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
    operations: z.array(workOrderOperationSchema),
    components: z.array(workOrderComponentSchema),
  }),
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
  pmPhase: z.enum(woPmPhaseSchema),
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

/** Filter detail team assign schema */
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
  team: pmPlanTeamFieldSchema,
})

export const workOrderTeamPatchResponseSchema = z.object({
  ok: z.literal(true),
})

/** Bulk assign Team A/B/EE/UT */
export const workOrderTeamBulkBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  team: pmPlanTeamFieldSchema,
})

export const workOrderTeamBulkResponseSchema = z.object({
  ok: z.literal(true),
  team: pmPlanTeamFieldSchema,
  updated: z.array(z.string()),
  notFound: z.array(z.string()),
})

export const workcenterItemSchema = z.object({
  wkctr: z.string(),
  displayName: z.string(),
  /** ชม.ว่างในวันที่วางแผน (HR − แผนที่จ่ายแล้ว) — จาก modal-detail */
  hrHours: z.number().nullable().optional(),
  plannedHours: z.number().nullable().optional(),
  availableHours: z.number().nullable().optional(),
  shiftTags: z.array(z.enum(['AA', 'BB'])).optional(),
  craftTags: z.array(z.enum(['EE', 'UT'])).optional(),
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

export const confirmationAddCloseBodySchema = z.object({
  wkctr: z.string().min(1),
  startD: z.string().min(1),
  startT: z.string().min(1),
  endD: z.string().min(1),
  endT: z.string().min(1),
})

export const confirmationAddCloseResponseSchema = z.object({
  ok: z.literal(true),
})

/** SAP mass confirmation limit (ประชุมลูกค้า ครั้งที่ 2) */
export const MASS_CONFIRM_MAX_ITEMS = SAP_MASS_CONFIRM_MAX

export const confirmationMassCloseBodySchema = z.object({
  idiw37n: z.array(z.coerce.number().int().positive()).min(1).max(MASS_CONFIRM_MAX_ITEMS),
  wkctr: z.string().min(1),
  startD: z.string().min(1),
  startT: z.string().min(1),
  endD: z.string().min(1),
  endT: z.string().min(1),
})

export const confirmationMassCloseFailItemSchema = z.object({
  idiw37: z.number().int(),
  message: z.string(),
})

export const confirmationMassCloseResponseSchema = z.object({
  ok: z.literal(true),
  succeeded: z.array(z.number().int()),
  failed: z.array(confirmationMassCloseFailItemSchema),
  maxItems: z.literal(MASS_CONFIRM_MAX_ITEMS),
})

export const confirmationDeleteCloseResponseSchema = z.object({
  ok: z.literal(true),
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

export const personnelCloseIdParamSchema = z.object({
  idwrkclose: z.coerce.number().int().positive(),
})

export const confirmationCommentItemSchema = z.object({
  idcom: z.coerce.number(),
  idiw37: z.coerce.number(),
  comdetail: z.string(),
  wkctr: z.string(),
  createdAt: z.string(),
})

export const confirmationCommentsResponseSchema = z.object({
  items: z.array(confirmationCommentItemSchema),
})

export const confirmationCommentBodySchema = z.object({
  comdetail: z.string().min(1).max(8000),
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

export const confirmationOkResponseSchema = z.object({
  ok: z.literal(true),
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

export const confirmationPreviewQuerySchema = z.object({
  status: z.enum(['pending', 'rejected', 'all']).optional().default('pending'),
})

export const workOrderTaskListItemSchema = z.object({
  tasklist: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  displayLine: z.string(),
  machinestatus: z.number().nullable(),
  pmman: z.number().nullable(),
  pmday: z.number().nullable(),
  mat: z.string(),
  matdescrip: z.string(),
  measurementKind: z.enum(['current_3phase', 'vibration_dst_db', 'none']),
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
  /** ใหม่: id ของแถว tbplangingwork (ใช้ลบรายตัว) — ค่าเก่าจะเป็น null */
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
  /** back-compat: ช่างคนแรก (legacy single-assign) */
  assigned: workOrderPlanningAssignedSchema.nullable(),
  /** Multi-assign: ช่างทั้งหมดที่ถูกมอบหมายให้ WO นี้ */
  assignees: z.array(workOrderPlanningAssignedSchema),
  workcenters: z.array(workcenterItemSchema),
  groups: z.array(workOrderPlanningGroupSchema),
  closeWoAccess: closeWoAccessSchema,
})

export { woPmFormHeaderSchema } from '../lib/wo-pm-form-header.js'
export { pmDataReadinessSchema } from '../lib/pm-data-readiness.js'

export const workOrderModalDetailResponseSchema = z.object({
  date: z.string(),
  woHeader: woPmFormHeaderSchema,
  taskList: workOrderTaskListSchema,
  machine: workOrderMachineSchema,
  planning: workOrderPlanningSchema,
  materials: workOrderMaterialsSchema,
  pmExecution: woPmExecutionSchema,
  page2Form: woPmPage2FormSchema,
  dataReadiness: pmDataReadinessSchema,
})

export const workOrderPlanningUpsertBodySchema = z.object({
  mode: z.enum(['P', 'G']),
  code: z.string().min(1),
  comment: z.string().optional(),
})

export const workOrderPlanningBatchBodySchema = z.object({
  /** wkctr (รหัส workcenter) หลายคน — backend dedupe + กรอง not-found ให้ */
  wkctrs: z.array(z.string().min(1)).min(1).max(200),
  /** หมายเหตุการจ่ายงาน (ใช้ร่วมกันทุกคน) */
  comment: z.string().max(255).optional(),
})

export const workOrderPlanningBatchResponseSchema = z.object({
  ok: z.literal(true),
  /** wkctr ที่เพิ่งจ่ายงานสำเร็จในรอบนี้ */
  assigned: z.array(z.string()),
  /** wkctr ที่ส่งมา แต่จ่ายไปแล้ว (ข้าม) */
  skipped: z.array(z.string()),
  /** wkctr ที่ไม่อยู่ใน tbworkcenter (เช่น พิมพ์ผิด) */
  notFound: z.array(z.string()),
})

export const workOrderPlanningOkResponseSchema = z.object({
  ok: z.literal(true),
})
