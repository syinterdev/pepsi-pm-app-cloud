import type { Pool } from 'pg'
import type { z } from 'zod'
import type {
  backlogFilterOptionsResponseSchema,
  backlogFilterDetailResponseSchema,
  backlogManhourResponseSchema,
  backlogManhourSearchBodySchema,
  backlogSearchBodySchema,
} from '../schemas/backlog.js'
import { formatUntimeUnit, manhourDateWhereSql } from '../lib/manhour-minutes.js'
import { listActivityFilterOptions } from '../lib/activity-type-label.js'
import { listWktypeZdFilterOptions } from '../lib/wktype-zd-mapping.js'
import {
  FACTORY_CODE,
  sqlFactoryScope,
  getMoveOverColor,
  mapOrderRowToEvent,
  monthRangeSec,
  type CalendarEvent,
  type OrderRow,
} from './scheduling-shared.js'
import { loadWorkflowSuffixMap } from './work-order-workflow.js'

type BacklogSearch = z.infer<typeof backlogSearchBodySchema>
type FilterOptions = z.infer<typeof backlogFilterOptionsResponseSchema>
type BacklogManhourSearch = z.infer<typeof backlogManhourSearchBodySchema>
type BacklogManhourSummary = z.infer<typeof backlogManhourResponseSchema>
type BacklogFilterDetail = z.infer<typeof backlogFilterDetailResponseSchema>

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

/** Convert hour unit to minutes before sum */
const MH_WORK_MIN_SQL = `CASE
  WHEN UPPER(TRIM(COALESCE(untime::text, ''))) = 'H' THEN COALESCE(work, 0) * 60
  ELSE COALESCE(work, 0)
END`

const MH_ACT_MIN_SQL = `CASE
  WHEN UPPER(TRIM(COALESCE(untime::text, ''))) = 'H' THEN COALESCE(actwork, 0) * 60
  ELSE COALESCE(actwork, 0)
END`

/** เงื่อนไขงานค้าง (CRTD/REL) ในเดือน — เฉพาะใบที่มีศูนย์งาน */
function backlogMonthScope(startSec: number, endSec: number, factory: string): {
  fromOrder: string
  fromOrderWithWc: string
  whereClause: string
  params: unknown[]
} {
  const whereClause = `WHERE ${sqlFactoryScope('o', '$3')}
        AND o.syst IN ('CRTD', 'REL')
        AND o.bscstart IS NOT NULL
        AND o.bscstart > 0
        AND NULLIF(TRIM(o.wkctr), '') IS NOT NULL
        AND (
          (o.bscstart >= $1 AND o.bscstart < $2)
          OR (o.actfinish >= $1 AND o.actfinish < $2)
          OR (o.cday >= $1 AND o.cday < $2)
        )`
  return {
    fromOrder: 'FROM app.view_order o',
    fromOrderWithWc: `FROM app.view_order o
      LEFT JOIN app.tbworkcenter wc ON wc.wkctr = TRIM(o.wkctr)`,
    whereClause,
    params: [startSec, endSec, factory],
  }
}

export async function listBacklogFilterOptions(pool: Pool): Promise<FilterOptions> {
  const factory = `%${FACTORY_CODE}%`

  const [wcR, fnR, fnMasterR, eqR] = await Promise.all([
    pool.query<{ wkctr: string; namewkctr: string | null; surnamewkctr: string | null }>(
      `SELECT wkctr, namewkctr, surnamewkctr FROM app.tbworkcenter ORDER BY wkctr`,
    ),
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
         AND functionalloc LIKE $1
       ORDER BY equipment`,
      [factory],
    ),
  ])

  return {
    activities: listActivityFilterOptions(),
    wktypes: listWktypeZdFilterOptions(),
    workcenters: wcR.rows.map((r) => {
      const name = [r.namewkctr, r.surnamewkctr].filter(Boolean).join(' ').trim()
      return {
        code: r.wkctr,
        label: name ? `${r.wkctr} = ${name}` : r.wkctr,
      }
    }),
    functionals:
      fnMasterR.rows.length > 0
        ? fnMasterR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funldescrip
              ? `${r.functionalloc} = ${r.funldescrip}`
              : r.functionalloc,
          }))
        : fnR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funcdescrip
              ? `${r.functionalloc} = ${r.funcdescrip}`
              : r.functionalloc,
          })),
    equipments: eqR.rows.map((r) => ({
      code: r.equipment,
      label: r.equdescrip ? `${r.equipment} = ${r.equdescrip}` : r.equipment,
    })),
  }
}

export async function listBacklogEvents(
  pool: Pool,
  body: BacklogSearch,
): Promise<CalendarEvent[]> {
  const { year, month } = body
  const { startSec, endSec, prefix } = monthRangeSec(year, month)
  const moveColor = await getMoveOverColor(pool)
  const factory = `%${FACTORY_CODE}%`
  const scope = backlogMonthScope(startSec, endSec, factory)

  const params = [...scope.params]
  const sql = `
    SELECT o.idiw37, o.wkorder, o.wktype, o.wkctr, o.bscstart, o.actfinish, o.cday, o.syst, o.operationshorttext, o.wkstcolor
    ${scope.fromOrder}
    ${scope.whereClause}
    ORDER BY o.bscstart DESC LIMIT 2500`

  const r = await pool.query<OrderRow>(sql, params)
  const items: CalendarEvent[] = []
  for (const row of r.rows) {
    const ev = mapOrderRowToEvent(row, moveColor)
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

export async function getBacklogManhourSummary(
  pool: Pool,
  body: BacklogManhourSearch,
): Promise<BacklogManhourSummary> {
  const fromSec = parseIsoYyyyMmDdToSec(body.fromDate)
  const toSec = parseIsoYyyyMmDdToSec(body.toDate)
  if (fromSec == null || toSec == null) {
    return {
      fromDate: body.fromDate,
      toDate: body.toDate,
      plannedMinutes: 0,
      plannedHours: 0,
      actualMinutes: 0,
      actualHours: 0,
      totalOrders: 0,
      completionCount: 0,
      completionPercent: 0,
      byWkzb: [],
      rows: [],
    }
  }

  const singleDay = body.fromDate === body.toDate
  const startSec = singleDay ? fromSec : Math.min(fromSec, toSec)
  const endSec = singleDay ? fromSec : Math.max(fromSec, toSec) + 86400
  const factory = `%${FACTORY_CODE}%`
  const dateWhere = manhourDateWhereSql(singleDay)
  const dateParams = singleDay ? [factory, startSec] : [factory, startSec, endSec]

  const aggR = await pool.query<{
    planned_min: string
    actual_min: string
    total_orders: string
    completion_count: string
  }>(
    `SELECT
       COALESCE(SUM(${MH_WORK_MIN_SQL}), 0)::text AS planned_min,
       COALESCE(SUM(${MH_ACT_MIN_SQL}), 0)::text AS actual_min,
       COUNT(*)::text AS total_orders,
       COUNT(*) FILTER (WHERE syst NOT IN ('CRTD', 'REL'))::text AS completion_count
     FROM app.view_order
     WHERE ${sqlFactoryScope('', '$1')}
       AND ${dateWhere}`,
    dateParams,
  )

  const plannedMinutes = Number(aggR.rows[0]?.planned_min ?? 0) || 0
  const actualMinutes = Number(aggR.rows[0]?.actual_min ?? 0) || 0
  const totalOrders = Number(aggR.rows[0]?.total_orders ?? 0) || 0
  const completionCount = Number(aggR.rows[0]?.completion_count ?? 0) || 0
  const completionPercent =
    totalOrders > 0 ? Math.round((completionCount / totalOrders) * 100) : 0

  const wkzbR = await pool.query<{
    wkzb: string
    zbdescrip: string | null
    cnt: string
  }>(
    `SELECT z.wkzb, z.zbdescrip, COALESCE(x.cnt, 0)::text AS cnt
     FROM app.tbwkzb z
     LEFT JOIN (
       SELECT wktype, COUNT(*)::int AS cnt
       FROM app.view_order
       WHERE ${sqlFactoryScope('', '$1')}
         AND ${dateWhere}
       GROUP BY wktype
     ) x ON x.wktype = z.wkzb
     ORDER BY z.wkzb`,
    dateParams,
  )

  const rowsR = await pool.query<{
    wkorder: string
    wktype: string | null
    syst: string | null
    work: string | number | null
    actwork: string | number | null
    untime: string | number | null
    operationshorttext: string | null
    bscstart: string | number | null
  }>(
    `SELECT wkorder, wktype, syst, work, actwork, untime, operationshorttext, bscstart
     FROM app.view_order
     WHERE ${sqlFactoryScope('', '$1')}
       AND ${dateWhere}
     ORDER BY bscstart DESC NULLS LAST
     LIMIT 2500`,
    dateParams,
  )

  return {
    fromDate: body.fromDate,
    toDate: body.toDate,
    plannedMinutes,
    plannedHours: Math.round((plannedMinutes / 60) * 100) / 100,
    actualMinutes,
    actualHours: Math.round((actualMinutes / 60) * 100) / 100,
    totalOrders,
    completionCount,
    completionPercent,
    byWkzb: wkzbR.rows.map((r) => ({
      code: r.wkzb,
      label: r.zbdescrip ? `${r.wkzb} = ${r.zbdescrip}` : r.wkzb,
      count: Number(r.cnt) || 0,
    })),
    rows: rowsR.rows.map((r) => ({
      wkorder: r.wkorder,
      wktype: r.wktype?.trim() ?? '',
      syst: r.syst?.trim() ?? '',
      work: r.work != null && r.work !== '' ? Number(r.work) || 0 : 0,
      actwork: r.actwork != null && r.actwork !== '' ? Number(r.actwork) || 0 : 0,
      unit: formatUntimeUnit(r.untime),
      operationshorttext: r.operationshorttext,
    })),
  }
}

export async function getBacklogFilterDetail(
  pool: Pool,
  body: BacklogSearch,
): Promise<BacklogFilterDetail> {
  const { year, month } = body
  const { startSec, endSec } = monthRangeSec(year, month)
  const factory = `%${FACTORY_CODE}%`
  const scope = backlogMonthScope(startSec, endSec, factory)

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
     ${scope.fromOrder}
     ${scope.whereClause}`,
    scope.params,
  )

  const wcR = await pool.query<{
    wkctr: string
    namewkctr: string | null
    surnamewkctr: string | null
    cnt: string
    work_sum: string
  }>(
    `SELECT
       TRIM(o.wkctr) AS wkctr,
       wc.namewkctr,
       wc.surnamewkctr,
       COUNT(*)::text AS cnt,
       COALESCE(SUM(COALESCE(o.work, 0)), 0)::text AS work_sum
     ${scope.fromOrderWithWc}
     ${scope.whereClause}
     GROUP BY TRIM(o.wkctr), wc.namewkctr, wc.surnamewkctr
     HAVING COUNT(*) > 0
     ORDER BY TRIM(o.wkctr)`,
    scope.params,
  )

  const byWkzbR = await pool.query<{
    wkzb: string
    zbdescrip: string | null
    cnt: string
  }>(
    `SELECT z.wkzb, z.zbdescrip, COALESCE(x.cnt, 0)::text AS cnt
     FROM app.tbwkzb z
     LEFT JOIN (
       SELECT o.wktype, COUNT(*)::int AS cnt
       ${scope.fromOrder}
       ${scope.whereClause}
       GROUP BY o.wktype
     ) x ON x.wktype = z.wkzb
     ORDER BY z.wkzb`,
    scope.params,
  )

  const totalOrders = Number(totalsR.rows[0]?.total_orders ?? 0) || 0
  const completionCount = Number(totalsR.rows[0]?.completion_count ?? 0) || 0
  const completionPercent =
    totalOrders > 0 ? Math.round((completionCount / totalOrders) * 100) : 0

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
    byWorkcenter: wcR.rows.map((r) => {
      const name = [r.namewkctr, r.surnamewkctr].filter(Boolean).join(' ').trim()
      return {
        code: r.wkctr,
        label: name ? `${r.wkctr} = ${name}` : r.wkctr,
        count: Number(r.cnt) || 0,
        workSumMinutes: Number(r.work_sum) || 0,
      }
    }),
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
