import type { Pool } from 'pg'
import { resolvePlannerPipeline } from '../lib/planner-pipeline.js'
import { resolveWoPmPhase } from '../lib/wo-pm-phase.js'
import {
  FACTORY_CODE,
  isPlanMovableStatus,
  monthRangeSec,
  sqlFactoryScope,
  unixToDateString,
  type CalendarEvent,
} from './scheduling-shared.js'
import { loadWorkflowSuffixMap } from './work-order-workflow.js'

export type PlanCalendarScope = 'assignee' | 'planner'

type PlanWorkRow = {
  idiw37: number
  wkorder: string
  wktype: string | null
  bscstart: string | number | null
  cday: string | number | null
  syst: string | null
  operationshorttext: string | null
  assign_count: number | string
  worktime_count: number | string
  ack_pending: number | string
  ack_acknowledged: number | string
  percent_close: string | number | null
  has_confirm: string | number | null
  confirm_qc_status: string | null
}

/** วันที่แสดงบนปฏิทิน (cday ถ้าย้ายแผน ไม่งั้น bscstart) */
function pickPlanDisplayUnix(row: PlanWorkRow): number | null {
  const cday = row.cday != null && row.cday !== '' ? Number(row.cday) : null
  if (cday != null && cday > 0) return cday
  const bscstart =
    row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
  if (bscstart != null && bscstart > 0) return bscstart
  return null
}

export function mapPlanWorkRowToEvent(row: PlanWorkRow): CalendarEvent | null {
  const bscstart =
    row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
  if (bscstart == null || !Number.isFinite(bscstart) || bscstart <= 0) {
    return null
  }

  const displayUnix = pickPlanDisplayUnix(row)
  if (displayUnix == null) return null

  const syst = (row.syst ?? '').trim()
  const pipeline = resolvePlannerPipeline({
    syst,
    assignCount: Number(row.assign_count ?? 0),
    worktimeCount: Number(row.worktime_count ?? 0),
    hasSupervisorClose: Number(row.has_confirm ?? 0) > 0,
    percentClose: row.percent_close,
    hasConfirm: row.has_confirm,
    confirmQcStatus: row.confirm_qc_status,
    ackPending: Number(row.ack_pending ?? 0),
    ackAcknowledged: Number(row.ack_acknowledged ?? 0),
  })

  const wktype = row.wktype?.trim() ?? ''
  const baseTitle = wktype ? `${row.wkorder} / ${wktype}` : row.wkorder

  return {
    id: String(row.idiw37),
    date: unixToDateString(displayUnix),
    title: baseTitle,
    orderId: row.wkorder,
    color: pipeline.color,
    description: row.operationshorttext?.trim() || undefined,
    canMovePlan: isPlanMovableStatus(syst),
    syst,
    pmPhase: resolveWoPmPhase(syst),
    pipelineStatus: pipeline.status,
    pipelineBadges: pipeline.badges,
  }
}

/**
 * ปฏิทินจ่ายงาน — สี Pipeline (ชุด B)
 * - assignee (ช่าง W): `view_planwork` กรอง `idwkctr` = session
 * - planner (Admin/Planner): งานทั้งโรงงานในเดือน (distinct WO)
 */
export async function listPlanCalendarEvents(
  pool: Pool,
  idwkctr: string,
  year: number,
  month: number,
  wkctr = '',
  scope: PlanCalendarScope = 'assignee',
): Promise<CalendarEvent[]> {
  const { startSec, endSec, prefix } = monthRangeSec(year, month)

  const r =
    scope === 'planner'
      ? await queryPlanCalendarPlannerScope(pool, startSec, endSec)
      : await queryPlanCalendarAssigneeScope(pool, idwkctr, startSec, endSec, wkctr)

  const items: CalendarEvent[] = []
  for (const row of r.rows) {
    const ev = mapPlanWorkRowToEvent(row)
    if (ev && ev.date.startsWith(prefix)) items.push(ev)
  }
  const suffixMap = await loadWorkflowSuffixMap(
    pool,
    items.map((e) => Number(e.id)).filter((n) => Number.isFinite(n)),
  )
  return items.map((ev) => {
    const suffix = suffixMap.get(Number(ev.id))
    if (!suffix) return ev
    return { ...ev, title: `${ev.title}/${suffix}` }
  })
}

async function queryPlanCalendarPlannerScope(
  pool: Pool,
  startSec: number,
  endSec: number,
) {
  const factory = `%${FACTORY_CODE}%`
  return pool.query<PlanWorkRow>(
    `SELECT i.idiw37, i.wkorder, i.wktype, i.bscstart, mov.cday, i.syst,
            i.operationshorttext,
            COALESCE(ac.n, 0) AS assign_count,
            COALESCE(wc.n, 0) AS worktime_count,
            COALESCE(ap.n, 0) AS ack_pending,
            COALESCE(aa.n, 0) AS ack_acknowledged,
            COALESCE(v.percent_close, 0) AS percent_close,
            COALESCE(v.has_confirm, 0) AS has_confirm,
            i.confirm_qc_status
     FROM app.tbiw37n i
     LEFT JOIN app.tbmoveplan mov ON mov.idiw37 = i.idiw37
     LEFT JOIN app.view_countpersonelclose v ON v.idiw37 = i.idiw37
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37
     ) ac ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbwrkclose w WHERE w.idiw37 = i.idiw37
     ) wc ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
       WHERE p.idiw37 = i.idiw37 AND p.ack_status = 'pending'
     ) ap ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
       WHERE p.idiw37 = i.idiw37 AND p.ack_status = 'acknowledged'
     ) aa ON true
     WHERE ${sqlFactoryScope('i', '$3')}
       AND i.bscstart IS NOT NULL
       AND i.bscstart > 0
       AND COALESCE(NULLIF(mov.cday, 0), i.bscstart) >= $1
       AND COALESCE(NULLIF(mov.cday, 0), i.bscstart) < $2
     ORDER BY i.bscstart DESC
     LIMIT 2500`,
    [startSec, endSec, factory],
  )
}

async function queryPlanCalendarAssigneeScope(
  pool: Pool,
  idwkctr: string,
  startSec: number,
  endSec: number,
  wkctr: string,
) {
  const techWkctr = wkctr.trim()
  const assigneeSql = techWkctr
    ? `(pw.idwkctr = $1 OR EXISTS (
         SELECT 1 FROM app.tbplangingwork mp2
         WHERE mp2.idiw37 = pw.idiw37 AND mp2.wkctr = $4
       ))`
    : `pw.idwkctr = $1`
  const params: (string | number)[] = techWkctr
    ? [idwkctr, startSec, endSec, techWkctr]
    : [idwkctr, startSec, endSec]

  return pool.query<PlanWorkRow>(
    `SELECT pw.idiw37, pw.wkorder, pw.wktype, pw.bscstart, pw.cday, pw.syst,
            pw.operationshorttext,
            COALESCE(ac.n, 0) AS assign_count,
            COALESCE(wc.n, 0) AS worktime_count,
            COALESCE(ap.n, 0) AS ack_pending,
            COALESCE(aa.n, 0) AS ack_acknowledged,
            COALESCE(v.percent_close, 0) AS percent_close,
            COALESCE(v.has_confirm, 0) AS has_confirm,
            i.confirm_qc_status
     FROM app.view_planwork pw
     LEFT JOIN app.view_countpersonelclose v ON v.idiw37 = pw.idiw37
     LEFT JOIN app.tbiw37n i ON i.idiw37 = pw.idiw37
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p WHERE p.idiw37 = pw.idiw37
     ) ac ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbwrkclose w WHERE w.idiw37 = pw.idiw37
     ) wc ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
       WHERE p.idiw37 = pw.idiw37 AND p.ack_status = 'pending'
     ) ap ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
       WHERE p.idiw37 = pw.idiw37 AND p.ack_status = 'acknowledged'
     ) aa ON true
     WHERE ${assigneeSql}
       AND pw.bscstart IS NOT NULL
       AND pw.bscstart > 0
       AND COALESCE(NULLIF(pw.cday, 0), pw.bscstart) >= $2
       AND COALESCE(NULLIF(pw.cday, 0), pw.bscstart) < $3
     ORDER BY pw.bscstart DESC
     LIMIT 500`,
    params,
  )
}
