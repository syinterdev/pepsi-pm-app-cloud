import type { Pool } from 'pg'
import type { z } from 'zod'
import {
  appendInFilter,
  FACTORY_CODE,
  sqlFactoryScope,
  getMoveOverColor,
  monthRangeSec,
  type CalendarEvent,
} from './scheduling-shared.js'
import {
  expandActivityFilterCodes,
  listActivityFilterOptions,
  PM_PLAN_TEAM_FILTER_OPTIONS,
} from '../lib/activity-type-label.js'
import {
  buildCalendarDayHourTotals,
  buildCalendarDayOrderCounts,
  mapCalendarOrderRowToEvent,
  mergeCalendarDayHourTotals,
  type CalendarOrderRow,
} from '../lib/calendar-event-display.js'
import {
  appendWorkTypeFilter,
} from '../lib/maint-activity-type.js'
import { listWktypeZdFilterOptions } from '../lib/wktype-zd-mapping.js'
import {
  appendCalendarDisplayStatusFilter,
  CALENDAR_DISPLAY_STATUS_OPTIONS,
} from '../lib/calendar-display-status-filter.js'
import {
  appendPmPhaseFilter,
  PM_PHASE_FILTER_OPTIONS,
} from '../lib/pm-phase-filter.js'
import { formatWorkcenterFilterLabel } from '../data/eng-technician-codes.js'
import { listWorkcenters } from './confirmation.js'
import {
  finalizeSystemStatusFilterOptions,
  formatSystemStatusFilterLabel,
} from '../lib/system-status-filter.js'
import type {
  calendarFilterDetailResponseSchema,
  calendarFilterOptionsResponseSchema,
  calendarSearchBodySchema,
} from '../schemas/calendar.js'

type CalendarSearch = z.infer<typeof calendarSearchBodySchema>
type FilterOptions = z.infer<typeof calendarFilterOptionsResponseSchema>
type CalendarFilterDetail = z.infer<typeof calendarFilterDetailResponseSchema>

function parseIsoYyyyMmDdToSec(v: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!m) return null
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
  const dt = new Date(yyyy, mm - 1, dd)
  const ms = dt.getTime()
  if (!Number.isFinite(ms)) return null
  return Math.floor(ms / 1000)
}

async function listStatusOptions(pool: Pool): Promise<{ code: string; label: string }[]> {
  try {
    const r = await pool.query<{ syst: string; wkstreason: string | null }>(
      `SELECT syst, wkstreason FROM app.tbwkstatus
       WHERE syst <> 'MOVE OVER'
       ORDER BY syst`,
    )
    return finalizeSystemStatusFilterOptions(
      r.rows.map((row) => ({
        code: row.syst,
        label: formatSystemStatusFilterLabel(row.syst, row.wkstreason),
      })),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('wkstreason')) throw err
    const r = await pool.query<{ syst: string }>(
      `SELECT syst FROM app.tbwkstatus
       WHERE syst <> 'MOVE OVER'
       ORDER BY syst`,
    )
    return finalizeSystemStatusFilterOptions(
      r.rows.map((row) => ({ code: row.syst, label: row.syst })),
    )
  }
}

export async function listCalendarFilterOptions(pool: Pool): Promise<FilterOptions> {
  // กิจกรรม: Z1/Z2/Z5 คงที่ — ไม่อ่าน tbactivitytype (ดู activity-type-label.ts)
  const factory = `%${FACTORY_CODE}%`

  const [statusOpts, workcenterItems, fnR, fnMasterR, eqR, priorityR] = await Promise.all([
    listStatusOptions(pool),
    listWorkcenters(pool),
    pool.query<{ functionalloc: string; funcdescrip: string | null }>(
      `SELECT DISTINCT functionalloc, funcdescrip
       FROM app.tbiw37n
       WHERE functionalloc IS NOT NULL AND functionalloc <> ''
         AND ${sqlFactoryScope('', '$1')}
       ORDER BY functionalloc`,
      [factory],
    ),
    pool.query<{ functionalloc: string; funldescrip: string | null }>(
      `SELECT functionalloc, funldescrip FROM app.tbfunctional ORDER BY functionalloc`,
    ),
    pool.query<{ equipment: string; equdescrip: string | null }>(
      `SELECT DISTINCT equipment, equdescrip
       FROM app.tbiw37n
       WHERE equipment IS NOT NULL AND equipment <> ''
         AND ${sqlFactoryScope('', '$1')}
       ORDER BY equipment`,
      [factory],
    ),
    pool.query<{ opac: string }>(
      `SELECT DISTINCT TRIM(opac) AS opac
       FROM app.tbiw37n
       WHERE opac IS NOT NULL AND TRIM(opac) <> ''
         AND ${sqlFactoryScope('', '$1')}
       ORDER BY opac`,
      [factory],
    ),
  ])

  return {
    activities: listActivityFilterOptions(),
    wktypes: listWktypeZdFilterOptions(),
    statuses: statusOpts,
    displayStatuses: CALENDAR_DISPLAY_STATUS_OPTIONS.map((o) => ({
      code: o.code,
      label: o.label,
    })),
    pmPhases: PM_PHASE_FILTER_OPTIONS.map((o) => ({ code: o.code, label: o.label })),
    priorities: priorityR.rows.map((r) => ({
      code: r.opac,
      label: `Priority ${r.opac}`,
    })),
    workcenters: workcenterItems.map((w) => ({
      code: w.wkctr,
      label: formatWorkcenterFilterLabel(w.wkctr, w.displayName),
    })),
    teams: [...PM_PLAN_TEAM_FILTER_OPTIONS],
    functionals:
      fnMasterR.rows.length > 0
        ? fnMasterR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funldescrip ? `${r.functionalloc} = ${r.funldescrip}` : r.functionalloc,
          }))
        : fnR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funcdescrip ? `${r.functionalloc} = ${r.funcdescrip}` : r.functionalloc,
          })),
    equipments: eqR.rows.map((r) => ({
      code: r.equipment,
      label: r.equdescrip ? `${r.equipment} = ${r.equdescrip}` : r.equipment,
    })),
  }
}

function appendTeamFilter(values: string[] | undefined, params: unknown[], tableAlias = ''): string {
  const col = tableAlias ? `${tableAlias}.team` : 'team'
  const list = values ?? []
  if (list.length === 0) return ''
  const includeNull = list.includes('')
  const nonEmpty = list.filter((x) => x !== '')
  let sql = ''
  if (nonEmpty.length > 0) {
    const start = params.length + 1
    const placeholders = nonEmpty.map((_, i) => `$${start + i}`).join(', ')
    params.push(...nonEmpty)
    sql += ` AND ${col} IN (${placeholders})`
  }
  if (includeNull) {
    sql += nonEmpty.length > 0 ? ` OR (${col} IS NULL OR ${col} = '')` : ` AND (${col} IS NULL OR ${col} = '')`
    if (nonEmpty.length > 0) sql = ` AND (${sql.slice(5)})`
  }
  return sql
}

export async function listCalendarEvents(
  pool: Pool,
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  const body: CalendarSearch = {
    year,
    month,
    activity: [],
    wktype: [],
    status: [],
    displayStatus: [],
    pmPhase: [],
    wkctr: [],
    team: [],
    functionalloc: [],
    equipment: [],
    priority: [],
  }
  const { items } = await listCalendarEventsFiltered(pool, body)
  return items
}

function buildCalendarFilteredFrom(
  body: CalendarSearch,
  includeWktype: boolean,
): { where: string; params: unknown[] } {
  const { year, month } = body
  const { startSec: monthStart, endSec: monthEnd } = monthRangeSec(year, month)
  const fromSec = body.fromDate ? parseIsoYyyyMmDdToSec(body.fromDate) : null
  const toSec = body.toDate ? parseIsoYyyyMmDdToSec(body.toDate) : null
  const startSec = fromSec != null ? fromSec : monthStart
  const endSec = toSec != null ? toSec + 86400 : monthEnd

  const params: unknown[] = [startSec, endSec, `%${FACTORY_CODE}%`]
  let where = `
    FROM app.view_order o
    LEFT JOIN app.tbmoveplan mp ON mp.idiw37 = o.idiw37
    LEFT JOIN app.tbiw37n ti ON ti.idiw37 = o.idiw37
    LEFT JOIN app.tbworkcenter wc ON wc.wkctr = o.wkctr
    LEFT JOIN app.view_countpersonelclose v ON v.idiw37 = o.idiw37
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS n FROM app.tbplangingwork p WHERE p.idiw37 = o.idiw37
    ) ac ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS n FROM app.tbwrkclose w WHERE w.idiw37 = o.idiw37
    ) wc_pipe ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
      WHERE p.idiw37 = o.idiw37 AND p.ack_status = 'pending'
    ) ap ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS n FROM app.tbplangingwork p
      WHERE p.idiw37 = o.idiw37 AND p.ack_status = 'acknowledged'
    ) aa ON true
    WHERE ${sqlFactoryScope('o', '$3')}
      AND o.bscstart IS NOT NULL
      AND o.bscstart > 0
      AND (
        (o.bscstart >= $1 AND o.bscstart < $2)
        OR (o.actfinish >= $1 AND o.actfinish < $2)
        OR (o.cday >= $1 AND o.cday < $2)
      )`

  where += appendInFilter('o.mat', expandActivityFilterCodes(body.activity), params)
  if (includeWktype) {
    where += appendWorkTypeFilter('o', body.wktype, params, appendInFilter)
  }
  where += appendInFilter('o.syst', body.status, params)
  where += appendCalendarDisplayStatusFilter(body.displayStatus ?? [], 'o', 'v', params)
  where += appendPmPhaseFilter(body.pmPhase ?? [], 'o', params)
  where += appendAssignedWkctrFilter(body.wkctr, params)
  where += appendInFilter('o.functionalloc', body.functionalloc, params)
  where += appendInFilter('o.equipment', body.equipment, params)
  where += appendInFilter('o.opac', body.priority, params)
  where += appendTeamFilter(body.team, params, 'o')
  return { where, params }
}

/** ช่างที่ถูกจ่ายงาน (tbplangingwork) หรือ wkctr บนใบงาน */
function appendAssignedWkctrFilter(wkctrs: string[] | undefined, params: unknown[]): string {
  const list = wkctrs ?? []
  if (list.length === 0) return ''
  const start = params.length + 1
  const placeholders = list.map((_, i) => `$${start + i}`).join(', ')
  params.push(...list)
  return ` AND (
    o.wkctr IN (${placeholders})
    OR EXISTS (
      SELECT 1 FROM app.tbplangingwork mpw
      WHERE mpw.idiw37 = o.idiw37
        AND mpw.wkctr IN (${placeholders})
        AND COALESCE(TRIM(mpw.pwteam), '') <> 'G'
    )
  )`
}

/** สรุปตัวกรองปฏิทิน */
export async function getCalendarFilterDetail(
  pool: Pool,
  body: CalendarSearch,
): Promise<CalendarFilterDetail> {
  const { year, month } = body
  const { where: whereAll, params: paramsAll } = buildCalendarFilteredFrom(body, true)

  const totalsR = await pool.query<{
    total_orders: string
    completion_count: string
    team_a_count: string
    team_a_work: string
    team_b_count: string
    team_b_work: string
    team_ee_count: string
    team_ee_work: string
    team_ut_count: string
    team_ut_work: string
  }>(
    `SELECT
       COUNT(*)::text AS total_orders,
       COUNT(*) FILTER (WHERE o.syst NOT IN ('CRTD', 'REL'))::text AS completion_count,
       COUNT(*) FILTER (WHERE o.team = 'A')::text AS team_a_count,
       COALESCE(SUM(COALESCE(o.work, 0)) FILTER (WHERE o.team = 'A'), 0)::text AS team_a_work,
       COUNT(*) FILTER (WHERE o.team = 'B')::text AS team_b_count,
       COALESCE(SUM(COALESCE(o.work, 0)) FILTER (WHERE o.team = 'B'), 0)::text AS team_b_work,
       COUNT(*) FILTER (WHERE o.team = 'EE')::text AS team_ee_count,
       COALESCE(SUM(COALESCE(o.work, 0)) FILTER (WHERE o.team = 'EE'), 0)::text AS team_ee_work,
       COUNT(*) FILTER (WHERE o.team = 'UT')::text AS team_ut_count,
       COALESCE(SUM(COALESCE(o.work, 0)) FILTER (WHERE o.team = 'UT'), 0)::text AS team_ut_work
     ${whereAll}`,
    paramsAll,
  )

  const totalOrders = Number(totalsR.rows[0]?.total_orders ?? 0) || 0
  const completionCount = Number(totalsR.rows[0]?.completion_count ?? 0) || 0
  const completionPercent =
    totalOrders > 0 ? Math.round((completionCount / totalOrders) * 100) : 0

  const { where: whereNoType, params: paramsNoType } = buildCalendarFilteredFrom(body, false)

  const byWkzbR = await pool.query<{
    wkzb: string
    zbdescrip: string | null
    cnt: string
  }>(
    `SELECT z.wkzb, z.zbdescrip, COALESCE(x.cnt, 0)::text AS cnt
     FROM app.tbwkzb z
     LEFT JOIN (
       SELECT o.wktype, COUNT(*)::int AS cnt
       ${whereNoType}
       GROUP BY o.wktype
     ) x ON x.wktype = z.wkzb
     ORDER BY z.wkzb`,
    paramsNoType,
  )

  return {
    year,
    month,
    totalOrders,
    completionCount,
    completionPercent,
    byWkzb: byWkzbR.rows.map((r) => ({
      code: r.wkzb,
      label: r.zbdescrip ? `${r.wkzb} = ${r.zbdescrip}` : r.wkzb,
      count: Number(r.cnt) || 0,
    })),
    teamA: {
      count: Number(totalsR.rows[0]?.team_a_count ?? 0) || 0,
      workSumMinutes: Number(totalsR.rows[0]?.team_a_work ?? 0) || 0,
    },
    teamB: {
      count: Number(totalsR.rows[0]?.team_b_count ?? 0) || 0,
      workSumMinutes: Number(totalsR.rows[0]?.team_b_work ?? 0) || 0,
    },
    teamEE: {
      count: Number(totalsR.rows[0]?.team_ee_count ?? 0) || 0,
      workSumMinutes: Number(totalsR.rows[0]?.team_ee_work ?? 0) || 0,
    },
    teamUT: {
      count: Number(totalsR.rows[0]?.team_ut_count ?? 0) || 0,
      workSumMinutes: Number(totalsR.rows[0]?.team_ut_work ?? 0) || 0,
    },
  }
}

export type CalendarEventsFilteredResult = {
  items: CalendarEvent[]
  dayHourTotals: Record<string, number>
  dayOrderCounts: Record<string, number>
}

/** ชั่วโมง confirm จริง (tbwrkclose + tbcofirm) ต่อวัน yyyy-mm-dd */
async function loadCalendarConfirmedHoursByDay(
  pool: Pool,
  startSec: number,
  endSec: number,
): Promise<Record<string, number>> {
  const factory = `%${FACTORY_CODE}%`
  const totals: Record<string, number> = {}

  const dayExpr = (col: string) =>
    `to_char(date_trunc('day', to_timestamp(${col})), 'YYYY-MM-DD')`

  const [personnelR, supervisorR] = await Promise.all([
    pool.query<{ day: string; mins: string }>(
      `SELECT ${dayExpr('w.cstdate')} AS day, COALESCE(SUM(w.wktimewk), 0)::text AS mins
       FROM app.tbwrkclose w
       INNER JOIN app.tbiw37n i ON i.idiw37 = w.idiw37
       WHERE w.cstdate >= $1 AND w.cstdate < $2
         AND ${sqlFactoryScope('i', '$3')}
       GROUP BY 1`,
      [startSec, endSec, factory],
    ),
    pool.query<{ day: string; mins: string }>(
      `SELECT ${dayExpr('c.stdate')} AS day, COALESCE(SUM(c.timewk), 0)::text AS mins
       FROM app.tbcofirm c
       INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
       WHERE c.stdate >= $1 AND c.stdate < $2
         AND ${sqlFactoryScope('i', '$3')}
       GROUP BY 1`,
      [startSec, endSec, factory],
    ).catch(() => ({ rows: [] as { day: string; mins: string }[] })),
  ])

  for (const row of [...personnelR.rows, ...supervisorR.rows]) {
    const mins = Number(row.mins) || 0
    if (mins <= 0) continue
    totals[row.day] = Math.round(((totals[row.day] ?? 0) + mins / 60) * 100) / 100
  }
  return totals
}

export async function listCalendarEventsFiltered(
  pool: Pool,
  body: CalendarSearch,
): Promise<CalendarEventsFilteredResult> {
  const { year, month } = body
  const { prefix } = monthRangeSec(year, month)
  const moveColor = await getMoveOverColor(pool)

  const { where, params } = buildCalendarFilteredFrom(body, true)
  const { startSec: monthStart, endSec: monthEnd } = monthRangeSec(year, month)
  const fromSec = body.fromDate ? parseIsoYyyyMmDdToSec(body.fromDate) : null
  const toSec = body.toDate ? parseIsoYyyyMmDdToSec(body.toDate) : null
  const rangeStart = fromSec != null ? fromSec : monthStart
  const rangeEnd = toSec != null ? toSec + 86400 : monthEnd

  const sql = `
    SELECT o.idiw37, o.wkorder, o.wktype, o.bscstart, o.actfinish, o.cday, o.syst,
           o.work, o.untime, o.team,
           o.operationshorttext, o.wkstcolor, o.equipment, o.equdescrip,
           o.functionalloc, o.funcdescrip, o.wkctr, o.opac,
           ti.mat, ti.ostdescription, ti.confirm_qc_status,
           mp.mpcount, mp.mday, mp.resoncom,
           wc.namewkctr, wc.surnamewkctr,
           COALESCE(v.percent_close, 0) AS percent_close,
           COALESCE(v.has_confirm, 0) AS has_confirm,
           COALESCE(ac.n, 0) AS assign_count,
           COALESCE(wc_pipe.n, 0) AS worktime_count,
           COALESCE(ap.n, 0) AS ack_pending,
           COALESCE(aa.n, 0) AS ack_acknowledged
    ${where}
    ORDER BY o.bscstart DESC LIMIT 2500`

  const r = await pool.query<CalendarOrderRow>(sql, params)

  const items: CalendarEvent[] = []
  for (const row of r.rows) {
    const ev = mapCalendarOrderRowToEvent(row, moveColor)
    if (ev && ev.date.startsWith(prefix)) items.push(ev)
  }
  const dayOrderCounts = buildCalendarDayOrderCounts(items)
  const plannedTotals = buildCalendarDayHourTotals(items)
  const confirmedTotals = await loadCalendarConfirmedHoursByDay(pool, rangeStart, rangeEnd)
  const dayHourTotals = mergeCalendarDayHourTotals(plannedTotals, confirmedTotals)
  return { items, dayHourTotals, dayOrderCounts }
}
