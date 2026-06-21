/** รูปแบบเดียวกับ frontend calendarEventsResponseSchema */
import { z } from 'zod'
import {
  plannerPipelineBadgeSchema,
  plannerPipelineStatusSchema,
} from '../lib/planner-pipeline.js'
import { pmExecutionStatusSchema } from '../lib/wo-pm-execution.js'
import { woPmPhaseSchema } from '../lib/wo-pm-phase.js'

export const calendarEventHoverDetailSchema = z.object({
  zoneTitle: z.string().optional(),
  workOrder: z.string(),
  wktype: z.string().optional(),
  wktypeLabel: z.string().optional(),
  pmPhase: z.enum(woPmPhaseSchema).optional(),
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

export const calendarEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  orderId: z.string(),
  color: z.string(),
  description: z.string().optional(),
  hoverDetail: calendarEventHoverDetailSchema.optional(),
  /** false เมื่อ syst ไม่ใช่ CRTD/REL (แผนเขียว TECO ห้าม drag) */
  canMovePlan: z.boolean(),
  syst: z.string().optional(),
  pmPhase: z.enum(woPmPhaseSchema),
  /** กำลังทำ · เสร็จแล้ว · ปิดงาน — หลังออกแผน */
  pmExecutionStatus: z.enum(pmExecutionStatusSchema).optional(),
  /** Z1 / Z2 / Z5 — สำหรับกรอง/แยกแสดงบนปฏิทิน */
  activityCode: z.string().optional(),
  /** จำนวนครั้งที่ย้ายแผน (แสดง /N ใน title) */
  moveCount: z.number().int().positive().optional(),
  /** ศูนย์งาน/ช่าง — ใช้บน Backlog note */
  wkctr: z.string().optional(),
  /** ชั่วโมงงาน (work+untime) — รวมช่องวันบนปฏิทิน */
  workHours: z.number().positive().optional(),
  /** ISO — มุมมองวัน Gantt */
  planStartIso: z.string().optional(),
  planEndIso: z.string().optional(),
  /** true = ส้ม/แดง ต้องเลือก Reason Code ก่อนบันทึก */
  moveReasonRequired: z.boolean().optional(),
  /** TECO ใน SAP แต่ยังไม่ปิดงานในโปรแกรม */
  tecoBellAlert: z.boolean().optional(),
  /** สีสถานะบนปฏิทิน — in_progress | overdue | moved | completed */
  displayStatus: z
    .enum(['in_progress', 'overdue', 'moved', 'completed'])
    .optional(),
  /** PM Plan team A / B / EE / UT */
  team: z.enum(['A', 'B', 'EE', 'UT']).optional(),
  /** Pipeline จ่ายงาน — unassigned / assigned / in_progress / closed */
  pipelineStatus: z.enum(plannerPipelineStatusSchema).optional(),
  pipelineBadges: z.array(z.enum(plannerPipelineBadgeSchema)).optional(),
})

export const calendarEventsResponseSchema = z.object({
  items: z.array(calendarEventSchema),
  year: z.number(),
  month: z.number(),
  /** รวมชั่วโมงต่อวัน yyyy-mm-dd → ชั่วโมง */
  dayHourTotals: z.record(z.string(), z.number()).optional(),
  /** จำนวน WO ต่อวัน yyyy-mm-dd */
  dayOrderCounts: z.record(z.string(), z.number()).optional(),
})

export const calendarFilterOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
})

export const calendarFilterOptionsResponseSchema = z.object({
  activities: z.array(calendarFilterOptionSchema),
  wktypes: z.array(calendarFilterOptionSchema),
  statuses: z.array(calendarFilterOptionSchema),
  /** สถานะแสดงบนปฏิทิน (Overdue / Completed / In Progress / UpComing) */
  displayStatuses: z.array(calendarFilterOptionSchema),
  /** Create / REL / Confirm — ตาม SAP syst */
  pmPhases: z.array(calendarFilterOptionSchema),
  /** Priority = opac จาก IW37N */
  priorities: z.array(calendarFilterOptionSchema),
  workcenters: z.array(calendarFilterOptionSchema),
  teams: z.array(calendarFilterOptionSchema),
  functionals: z.array(calendarFilterOptionSchema),
  equipments: z.array(calendarFilterOptionSchema),
})

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const calendarSearchBodySchema = z.object({
  year: z.number().int().min(1970).max(2100),
  month: z.number().int().min(1).max(12),
  activity: z.array(z.string()),
  wktype: z.array(z.string()),
  status: z.array(z.string()),
  /** สถานะสีบนปฏิทิน — overdue | completed | in_progress | upcoming */
  displayStatus: z.array(z.string()),
  /** Create / REL / Confirm */
  pmPhase: z.array(z.enum(woPmPhaseSchema)),
  wkctr: z.array(z.string()),
  team: z.array(z.string()),
  functionalloc: z.array(z.string()),
  equipment: z.array(z.string()),
  /** Priority (OpAc จาก SAP) */
  priority: z.array(z.string()),
  fromDate: isoDateSchema.optional(),
  toDate: isoDateSchema.optional(),
})

/** Calendar filter detail schema */
export const calendarFilterDetailTeamSchema = z.object({
  count: z.number(),
  workSumMinutes: z.number(),
})

export const calendarFilterDetailResponseSchema = z.object({
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
  teamA: calendarFilterDetailTeamSchema,
  teamB: calendarFilterDetailTeamSchema,
  teamEE: calendarFilterDetailTeamSchema,
  teamUT: calendarFilterDetailTeamSchema,
})
