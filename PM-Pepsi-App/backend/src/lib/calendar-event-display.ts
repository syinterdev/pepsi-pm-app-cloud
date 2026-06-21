import {
  activityTypeDisplayCode,
  formatActivityTypeFilterLabel,
} from './activity-type-label.js'
import { formatWktypeFilterLabel, formatWktypeDisplayWithMat } from './wktype-zd-mapping.js'
import {
  PM_EXECUTION_META,
  resolvePmExecutionStatus,
  type PmExecutionStatus,
} from './wo-pm-execution.js'
import { resolveWoPmPhase, type WoPmPhase } from './wo-pm-phase.js'
import {
  hasCalendarPlanMove,
  hasCalendarWorkOrderNumber,
  isCalendarDisplayDateOverdue,
  resolveCalendarMoveReasonRequired,
  resolveCalendarTecoBellAlert,
} from './calendar-move-policy.js'
import { workValueToMinutes } from './manhour-minutes.js'
import {
  isPlanMovableStatus,
  pickDisplayUnix,
  unixToDateString,
  type CalendarEvent,
} from '../services/scheduling-shared.js'

import { BRAND_CALENDAR } from './brand-palette.js'
import {
  resolvePlannerPipeline,
  type PlannerPipelineBadge,
  type PlannerPipelineStatus,
} from './planner-pipeline.js'

/** สีปฏิทิน Work scheduling — สไลด์ลูกค้า (แดง/ส้ม/น้ำเงิน/เขียว) */
export const CALENDAR_STATUS_COLORS = {
  /** น้ำเงิน — ประมาณการ · ยังไม่มีเลข WO */
  estimate: BRAND_CALENDAR.inProgress,
  /** ส้ม — ยังไม่ถึงวัน · มีเลข WO แล้ว */
  upcomingWo: BRAND_CALENDAR.moved,
  completed: BRAND_CALENDAR.completed,
  overdue: BRAND_CALENDAR.overdue,
} as const

/** `in_progress` = estimate (blue) · `moved` = upcoming WO (orange) — legacy enum names */
export type CalendarEventDisplayStatus = 'in_progress' | 'overdue' | 'moved' | 'completed'

export type CalendarOrderRow = {
  idiw37: number
  wkorder: string
  wktype: string | null
  mat: string | null
  team?: string | null
  bscstart: string | number | null
  actfinish: string | number | null
  cday: string | number | null
  syst: string | null
  operationshorttext: string | null
  ostdescription: string | null
  wkctr: string | null
  opac: string | null
  equipment: string | null
  equdescrip: string | null
  functionalloc: string | null
  funcdescrip: string | null
  wkstcolor: string | null
  mpcount: number | null
  mday?: string | number | null
  resoncom?: string | null
  namewkctr?: string | null
  surnamewkctr?: string | null
  percent_close?: string | number | null
  has_confirm?: string | number | null
  confirm_qc_status?: string | null
  assign_count?: number | string | null
  worktime_count?: number | string | null
  ack_pending?: number | string | null
  ack_acknowledged?: number | string | null
  work?: string | number | null
  untime?: string | number | null
}

/** ชั่วโมงจาก work + untime — 0 เมื่อไม่มีค่า (ไม่รวมใน dayHourTotals) */
export function resolveCalendarWorkHours(
  work: string | number | null | undefined,
  untime: string | number | null | undefined,
): number {
  const w = work != null && work !== '' ? Number(work) : 0
  if (!Number.isFinite(w) || w <= 0) return 0
  return workValueToMinutes(w, untime) / 60
}

/** ชั่วโมงสำหรับแถบ Gantt — default 1 ชม. เมื่อไม่มี work */
export function resolveCalendarWorkHoursForGantt(
  work: string | number | null | undefined,
  untime: string | number | null | undefined,
): number {
  const h = resolveCalendarWorkHours(work, untime)
  return h > 0 ? h : 1
}

export function resolveCalendarPlanTimes(
  bscstartSec: number,
  workHours: number,
): { planStartIso: string; planEndIso: string } {
  const base = new Date(bscstartSec * 1000)
  let h = base.getHours()
  let m = base.getMinutes()
  if (h === 0 && m === 0) {
    h = 8
    m = 0
  }
  const startMs = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    h,
    m,
  ).getTime()
  const endMs = startMs + workHours * 3600 * 1000
  return {
    planStartIso: new Date(startMs).toISOString(),
    planEndIso: new Date(endMs).toISOString(),
  }
}

export function buildCalendarDayHourTotals(
  events: readonly { date: string; workHours?: number }[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const ev of events) {
    const hours = ev.workHours ?? 0
    if (hours <= 0) continue
    totals[ev.date] = Math.round(((totals[ev.date] ?? 0) + hours) * 100) / 100
  }
  return totals
}

export function buildCalendarDayOrderCounts(
  events: readonly { date: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const ev of events) {
    counts[ev.date] = (counts[ev.date] ?? 0) + 1
  }
  return counts
}

export function mergeCalendarDayHourTotals(
  planned: Record<string, number>,
  confirmed: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = { ...planned }
  for (const [day, hours] of Object.entries(confirmed)) {
    if (hours <= 0) continue
    merged[day] = Math.round(((merged[day] ?? 0) + hours) * 100) / 100
  }
  return merged
}

/** รายละเอียด hover ปฏิทิน — เทียบสไลด์ลูกค้า (Planning / Scheduling) */
export type CalendarEventHoverDetail = {
  zoneTitle?: string
  workOrder: string
  wktype?: string
  wktypeLabel?: string
  pmPhase?: WoPmPhase
  syst?: string
  resourceName?: string
  wkctr?: string
  functionalDesc?: string
  planDate?: string
  /** SAP Basic Finish — สำหรับ audit Order Frame */
  finishDate?: string
  /** กรอบเวลาใบงาน (bscstart + work) — ช่วง HH:mm */
  orderFrameStart?: string
  orderFrameEnd?: string
  movedToDate?: string
  moveReason?: string
}

function formatTimeFromIso(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDotDate(sec: string | number | null | undefined): string {
  if (sec == null || sec === '') return ''
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return ''
  const d = new Date(n * 1000)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function hasPlanMove(row: CalendarOrderRow): boolean {
  return hasCalendarPlanMove({
    cday: row.cday,
    mpcount: row.mpcount,
    syst: row.syst,
  })
}

export function resolveCalendarEventColor(
  row: CalendarOrderRow,
  moveColor: string,
  displayUnix: number,
): {
  color: string
  pmExecutionStatus: PmExecutionStatus
  moved: boolean
  displayStatus: CalendarEventDisplayStatus
} {
  const pmExecutionStatus = resolvePmExecutionStatus({
    syst: row.syst,
    percentClose: row.percent_close,
    hasConfirm: row.has_confirm,
    confirmQcStatus: row.confirm_qc_status,
  })

  const moved = hasPlanMove(row)
  const hasWo = hasCalendarWorkOrderNumber(row.wkorder)

  if (pmExecutionStatus === 'done' || pmExecutionStatus === 'closed') {
    return {
      color: CALENDAR_STATUS_COLORS.completed,
      pmExecutionStatus,
      moved,
      displayStatus: 'completed',
    }
  }
  if (
    isPlanMovableStatus(row.syst) &&
    isCalendarDisplayDateOverdue(displayUnix)
  ) {
    return {
      color: CALENDAR_STATUS_COLORS.overdue,
      pmExecutionStatus,
      moved,
      displayStatus: 'overdue',
    }
  }
  if (isPlanMovableStatus(row.syst) && hasWo) {
    return {
      color: moveColor || CALENDAR_STATUS_COLORS.upcomingWo,
      pmExecutionStatus,
      moved,
      displayStatus: 'moved',
    }
  }
  return {
    color: CALENDAR_STATUS_COLORS.estimate,
    pmExecutionStatus,
    moved,
    displayStatus: 'in_progress',
  }
}

export function resolveCalendarEventPipeline(row: CalendarOrderRow): {
  status: PlannerPipelineStatus
  badges: PlannerPipelineBadge[]
  color: string
} {
  return resolvePlannerPipeline({
    syst: row.syst,
    assignCount: Number(row.assign_count ?? 0),
    worktimeCount: Number(row.worktime_count ?? 0),
    hasSupervisorClose: Number(row.has_confirm ?? 0) > 0,
    percentClose: row.percent_close,
    hasConfirm: row.has_confirm,
    confirmQcStatus: row.confirm_qc_status,
    ackPending: Number(row.ack_pending ?? 0),
    ackAcknowledged: Number(row.ack_acknowledged ?? 0),
  })
}

/** เลข WO เต็ม + ประเภท (Maint Code · ZB · ZD) + /N เมื่อย้ายแผน */
export function buildCalendarEventTitle(row: CalendarOrderRow): string {
  const wkorder = (row.wkorder ?? '').trim()
  const wktype = (row.wktype ?? '').trim()
  const activityCode = activityTypeDisplayCode((row.mat ?? '').trim())
  const typePart = wktype
    ? formatWktypeDisplayWithMat(wktype, row.mat).primary
    : activityCode
  let title = typePart ? `${wkorder} / ${typePart}` : wkorder

  const mpcount = row.mpcount != null ? Number(row.mpcount) : 0
  if (hasPlanMove(row) && mpcount >= 1) {
    title = `${title}/${mpcount}`
  }

  return title
}

export function buildCalendarEventHoverDetail(row: CalendarOrderRow): CalendarEventHoverDetail {
  const wkorder = (row.wkorder ?? '').trim()
  const wktype = (row.wktype ?? '').trim()
  const resourceName = [row.namewkctr, row.surnamewkctr].filter(Boolean).join(' ').trim()
  const wkctr = (row.wkctr ?? '').trim()
  const functionalDesc = (row.funcdescrip ?? '').trim() || (row.functionalloc ?? '').trim()
  const mpcount = row.mpcount != null ? Number(row.mpcount) : 0
  const movedToDate =
    hasPlanMove(row) && row.mday != null && row.mday !== '' && Number(row.mday) > 0
      ? formatDotDate(row.mday)
      : mpcount >= 1 && row.cday != null && row.cday !== '' && Number(row.cday) > 0
        ? formatDotDate(row.cday)
        : undefined
  const moveReason = (row.resoncom ?? '').trim() || undefined

  return {
    zoneTitle: (row.operationshorttext ?? '').trim() || undefined,
    workOrder: wkorder,
    wktype: wktype || undefined,
    wktypeLabel: wktype ? formatWktypeDisplayWithMat(wktype, row.mat).primary : undefined,
    pmPhase: resolveWoPmPhase(row.syst),
    syst: (row.syst ?? '').trim() || undefined,
    resourceName: resourceName || undefined,
    wkctr: wkctr || undefined,
    functionalDesc: functionalDesc || undefined,
    planDate: formatDotDate(row.bscstart) || undefined,
    movedToDate,
    moveReason,
  }
}

/** Tooltip / description — fallback สำหรับ a11y */
export function buildCalendarEventDescription(row: CalendarOrderRow): string {
  const lines: string[] = []
  const wkorder = (row.wkorder ?? '').trim()
  if (wkorder) lines.push(`Work Order: ${wkorder}`)

  const start = formatDotDate(row.bscstart)
  const finish = formatDotDate(row.actfinish)
  if (start) lines.push(`Start Date: ${start}`)
  if (finish) lines.push(`End Date: ${finish}`)

  const fl = (row.functionalloc ?? '').trim()
  const flDesc = (row.funcdescrip ?? '').trim()
  if (fl) lines.push(`Functional Location: ${fl}${flDesc ? ` — ${flDesc}` : ''}`)

  const eq = (row.equipment ?? '').trim()
  const eqDesc = (row.equdescrip ?? '').trim()
  if (eq) lines.push(`Equipment: ${eq}${eqDesc ? ` — ${eqDesc}` : ''}`)

  const wkctr = (row.wkctr ?? '').trim()
  if (wkctr) lines.push(`Work Centre: ${wkctr}`)

  const mat = (row.mat ?? '').trim()
  if (mat) {
    lines.push(`Activity Type: ${formatActivityTypeFilterLabel(mat)}`)
  }

  const opac = (row.opac ?? '').trim()
  const opShort = (row.operationshorttext ?? '').trim()
  if (opac || opShort) {
    lines.push(`Operation: ${[opac, opShort].filter(Boolean).join(' — ')}`)
  }

  const opLong = (row.ostdescription ?? '').trim()
  if (opLong) lines.push(opLong)

  const mpcount = row.mpcount != null ? Number(row.mpcount) : 0
  if (hasPlanMove(row) && mpcount >= 1) {
    lines.push(`ย้ายแผนครั้งที่ ${mpcount}`)
    const moved = formatDotDate(row.mday ?? row.cday)
    if (moved) lines.push(`Moved to: ${moved}`)
    const reason = (row.resoncom ?? '').trim()
    if (reason) lines.push(`Reason: ${reason}`)
  }

  const wktype = (row.wktype ?? '').trim()
  if (wktype) lines.push(`Type: ${formatWktypeFilterLabel(wktype)}`)

  const resourceName = [row.namewkctr, row.surnamewkctr].filter(Boolean).join(' ').trim()
  if (resourceName) lines.push(`Resources: ${resourceName}`)

  const exec = resolvePmExecutionStatus({
    syst: row.syst,
    percentClose: row.percent_close,
    hasConfirm: row.has_confirm,
    confirmQcStatus: row.confirm_qc_status,
  })
  lines.push(`สถานะ: ${PM_EXECUTION_META[exec].label}`)

  return lines.join('\n')
}

export function mapCalendarOrderRowToEvent(
  row: CalendarOrderRow,
  moveColor: string,
): CalendarEvent | null {
  const bscstart =
    row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
  if (bscstart == null || !Number.isFinite(bscstart) || bscstart <= 0) {
    return null
  }

  const displayUnix = pickDisplayUnix(row)
  if (displayUnix == null) return null

  const syst = (row.syst ?? '').trim()
  const scheduling = resolveCalendarEventColor(row, moveColor, displayUnix)
  const pipeline = resolveCalendarEventPipeline(row)
  const usePipelineColor = isPlanMovableStatus(syst)
  const { pmExecutionStatus, moved, displayStatus } = scheduling
  const color = usePipelineColor ? pipeline.color : scheduling.color
  const moveReasonRequired = resolveCalendarMoveReasonRequired({
    syst: row.syst,
    displayUnix,
    wkorder: row.wkorder,
    cday: row.cday,
    mpcount: row.mpcount,
  })
  const tecoBellAlert = resolveCalendarTecoBellAlert({
    syst: row.syst,
    percentClose: row.percent_close,
    hasConfirm: row.has_confirm,
    confirmQcStatus: row.confirm_qc_status,
  })
  const activityCode = activityTypeDisplayCode((row.mat ?? '').trim())
  const workHours = resolveCalendarWorkHours(row.work, row.untime)
  const ganttHours = resolveCalendarWorkHoursForGantt(row.work, row.untime)
  const planTimes = resolveCalendarPlanTimes(bscstart, ganttHours)
  const hoverDetail: CalendarEventHoverDetail = {
    ...buildCalendarEventHoverDetail(row),
    finishDate: formatDotDate(row.actfinish) || undefined,
    orderFrameStart: formatTimeFromIso(planTimes.planStartIso),
    orderFrameEnd: formatTimeFromIso(planTimes.planEndIso),
  }

  const team = (row.team ?? '').trim()
  const pmTeam =
    team === 'A' || team === 'B' || team === 'EE' || team === 'UT' ? team : undefined

  return {
    id: String(row.idiw37),
    date: unixToDateString(displayUnix),
    title: buildCalendarEventTitle(row),
    orderId: row.wkorder,
    color,
    description: buildCalendarEventDescription(row) || undefined,
    hoverDetail,
    canMovePlan: isPlanMovableStatus(syst),
    syst,
    pmPhase: resolveWoPmPhase(syst),
    pmExecutionStatus,
    displayStatus,
    team: pmTeam,
    activityCode: activityCode || undefined,
    moveCount: moved && row.mpcount != null ? Number(row.mpcount) : undefined,
    workHours: workHours > 0 ? workHours : undefined,
    planStartIso: planTimes.planStartIso,
    planEndIso: planTimes.planEndIso,
    moveReasonRequired,
    tecoBellAlert: tecoBellAlert || undefined,
    pipelineStatus: pipeline.status,
    pipelineBadges: pipeline.badges,
  }
}
