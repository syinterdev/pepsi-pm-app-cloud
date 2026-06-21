import type { Pool } from 'pg'
import {
  getWorkOrderWorkflowSteps,
  workflowSuffixFromSteps,
} from './work-order-workflow.js'
import { getConfirmQcSnapshot } from './confirm-qc.js'
import type { z } from 'zod'
import type {
  workOrderFilterOptionsResponseSchema,
  workOrderListItemSchema,
  workOrderFilterDetailResponseSchema,
  workOrderSearchBodySchema,
  workOrderSearchRowSchema,
} from '../schemas/work-orders.js'
import { hasPermission } from '../lib/has-permission.js'
import { loadWorkcenterCodesForPlanningGroup } from '../lib/planning-group.js'
import {
  loadPlanningAvailableHoursByWkctr,
  mergeWorkcenterAvailableHours,
} from '../lib/planning-available-hours.js'
import { resolveWoPmPhase } from '../lib/wo-pm-phase.js'
import {
  expandActivityFilterCodes,
  listActivityFilterOptions,
  PM_PLAN_TEAM_FILTER_OPTIONS,
} from '../lib/activity-type-label.js'
import {
  appendWorkTypeFilter,
} from '../lib/maint-activity-type.js'
import { listWktypeZdFilterOptions } from '../lib/wktype-zd-mapping.js'
import {
  finalizeSystemStatusFilterOptions,
  formatSystemStatusFilterLabel,
  SYSTEM_STATUS_FILTER_EXCLUDE,
} from '../lib/system-status-filter.js'
import type { PmPlanTeamField } from '../lib/pm-plan-team.js'
import {
  appendInFilter,
  FACTORY_CODE,
  isPlanMovableStatus,
  sqlFactoryScope,
} from './scheduling-shared.js'
import { formatUnixDate } from './scheduling-move.js'
import {
  derivePlanningWorkcenterTags,
} from '../lib/planning-workcenter-tags.js'
import { buildWoPmFormHeader } from '../lib/wo-pm-form-header.js'
import { buildPmDataReadiness } from '../lib/pm-data-readiness.js'
import {
  buildTaskMeasurementFields,
  loadWoPmExecution,
} from './wo-pm-execution-data.js'
import { loadWoPmPage2Form } from './wo-pm-page2.js'

type WorkOrderListItem = z.infer<typeof workOrderListItemSchema>
type WorkOrderSearch = z.infer<typeof workOrderSearchBodySchema>
type FilterOptions = z.infer<typeof workOrderFilterOptionsResponseSchema>
type WorkOrderSearchRow = z.infer<typeof workOrderSearchRowSchema>
type WorkOrderFilterDetail = z.infer<typeof workOrderFilterDetailResponseSchema>

type Iw37Row = {
  idiw37: number
  wkorder: string
  mntplan: string | null
  wktype: string | null
  equipment: string | null
  equdescrip: string | null
  functionalloc: string | null
  funcdescrip: string | null
  untime: string | number | null
  syst: string | null
  bscstart: string | number | null
  actfinish: string | number | null
  systemstatus: string | null
  wkctr: string | null
  operationshorttext: string | null
  ostdescription: string | null
  opac: string | null
  work: string | number | null
  actwork: string | number | null
}

function unixToIsoDate(sec: string | number | null): string {
  if (sec == null || sec === '') return ''
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return ''
  return unixToDateString(n)
}

function unixToDateString(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

function appendTeamFilter(values: string[], params: unknown[]): string {
  if (values.length === 0) return ''
  const includeNull = values.includes('')
  const nonEmpty = values.filter((x) => x !== '')
  let sql = ''
  if (nonEmpty.length > 0) {
    const start = params.length + 1
    const placeholders = nonEmpty.map((_, i) => `$${start + i}`).join(', ')
    params.push(...nonEmpty)
    sql += ` AND team IN (${placeholders})`
  }
  if (includeNull) {
    sql += nonEmpty.length > 0 ? ` OR (team IS NULL OR team = '')` : ` AND (team IS NULL OR team = '')`
    if (nonEmpty.length > 0) sql = ` AND (${sql.slice(5)})`
  }
  return sql
}

function appendTeamFilterVo(values: string[], params: unknown[]): string {
  if (values.length === 0) return ''
  const includeNull = values.includes('')
  const nonEmpty = values.filter((x) => x !== '')
  let sql = ''
  if (nonEmpty.length > 0) {
    const start = params.length + 1
    const placeholders = nonEmpty.map((_, i) => `$${start + i}`).join(', ')
    params.push(...nonEmpty)
    sql += ` AND vo.team IN (${placeholders})`
  }
  if (includeNull) {
    sql +=
      nonEmpty.length > 0
        ? ` OR (vo.team IS NULL OR vo.team = '')`
        : ` AND (vo.team IS NULL OR vo.team = '')`
    if (nonEmpty.length > 0) sql = ` AND (${sql.slice(5)})`
  }
  return sql
}

function mapRow(row: Iw37Row): WorkOrderListItem {
  const title =
    row.operationshorttext?.trim() || row.ostdescription?.trim() || row.wkorder
  return {
    id: String(row.idiw37),
    title,
    orderType: row.wktype?.trim() ?? '',
    equipment: row.equdescrip?.trim() || row.equipment?.trim() || '',
    functLoc: row.functionalloc?.trim() ?? '',
    priority: row.untime != null && row.untime !== '' ? String(row.untime) : '',
    status: row.syst?.trim() ?? '',
    basicStart: unixToIsoDate(row.bscstart),
    basicFinish: unixToIsoDate(row.actfinish),
    plant: FACTORY_CODE,
    workCenter: row.wkctr?.trim() ?? '',
    systemStatus: row.systemstatus?.trim() ?? row.syst?.trim() ?? '',
    userStatus: '',
    description: row.ostdescription?.trim() || row.operationshorttext?.trim() || '',
  }
}

const SELECT_IW37 = `
  SELECT idiw37, wkorder, mntplan, wktype, equipment, equdescrip, functionalloc, untime,
         syst, bscstart, actfinish, systemstatus, wkctr, operationshorttext,
         ostdescription, opac, work
  FROM app.tbiw37n
`

export async function listWorkOrders(
  pool: Pool,
  opts?: { q?: string; status?: string },
): Promise<WorkOrderListItem[]> {
  const params: unknown[] = [`%${FACTORY_CODE}%`]
  let sql = `${SELECT_IW37} WHERE ${sqlFactoryScope('', '$1')}`
  if (opts?.status) {
    params.push(opts.status)
    sql += ` AND syst = $${params.length}`
  }
  if (opts?.q?.trim()) {
    params.push(`%${opts.q.trim()}%`)
    const i = params.length
    sql += ` AND (wkorder ILIKE $${i} OR operationshorttext ILIKE $${i} OR equdescrip ILIKE $${i})`
  }
  sql += ` ORDER BY bscstart DESC NULLS LAST LIMIT 500`

  const r = await pool.query<Iw37Row>(sql, params)
  return r.rows.map(mapRow)
}

export async function listWorkOrderFilterOptions(pool: Pool): Promise<FilterOptions> {
  const factory = `%${FACTORY_CODE}%`
  const [statusesR, wcR, fnDistinctR, fnMasterR, eqR] = await Promise.all([
    pool.query<{ syst: string; wkstreason: string | null; wkstcolor: string | null }>(
      `SELECT syst, wkstreason, wkstcolor
       FROM app.tbwkstatus
       ORDER BY syst`,
    ),
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
         AND ${sqlFactoryScope('', '$1')}
       ORDER BY equipment`,
      [factory],
    ),
  ])

  return {
    activities: listActivityFilterOptions(),
    wktypes: listWktypeZdFilterOptions(),
    statuses: finalizeSystemStatusFilterOptions(
      statusesR.rows
        .filter((r) => !SYSTEM_STATUS_FILTER_EXCLUDE.has(r.syst))
        .map((r) => ({
          code: r.syst,
          label: formatSystemStatusFilterLabel(r.syst, r.wkstreason),
        })),
    ),
    workcenters: wcR.rows.map((r) => {
      const name = [r.namewkctr, r.surnamewkctr].filter(Boolean).join(' ').trim()
      return { code: r.wkctr, label: name ? `${r.wkctr} = ${name}` : r.wkctr }
    }),
    teams: [...PM_PLAN_TEAM_FILTER_OPTIONS],
    functionals:
      fnMasterR.rows.length > 0
        ? fnMasterR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funldescrip ? `${r.functionalloc} = ${r.funldescrip}` : r.functionalloc,
          }))
        : fnDistinctR.rows.map((r) => ({
            code: r.functionalloc,
            label: r.funcdescrip ? `${r.functionalloc} = ${r.funcdescrip}` : r.functionalloc,
          })),
    equipments: eqR.rows.map((r) => ({
      code: r.equipment,
      label: r.equdescrip ? `${r.equipment} = ${r.equdescrip}` : r.equipment,
    })),
  }
}

type SearchRow = {
  idiw37: number
  wkorder: string
  mntplan: string | null
  wktype: string | null
  mat: string | null
  equdescrip: string | null
  funcdescrip: string | null
  work: string | number | null
  untime: string | number | null
  actfinish: string | number | null
  cday: string | number | null
  bscstart: string | number | null
  team: string | null
  wkstcolor: string | null
  operationshorttext: string | null
  syst: string | null
  confirm_qc_status: string | null
  qc_ready: boolean | null
}

export async function searchWorkOrders(
  pool: Pool,
  body: WorkOrderSearch,
): Promise<WorkOrderSearchRow[]> {
  const factory = `%${FACTORY_CODE}%`
  const params: unknown[] = [factory]
  let sql = `
    SELECT vo.idiw37, vo.wkorder, vo.mntplan, vo.wktype, vo.mat, vo.equdescrip, vo.funcdescrip,
           vo.work, vo.untime, vo.actfinish, vo.cday, vo.bscstart, vo.team, vo.wkstcolor,
           vo.operationshorttext, vo.syst,
           i.confirm_qc_status,
           (
             EXISTS (SELECT 1 FROM app.tbconfirmimg img WHERE img.idiw37 = vo.idiw37)
             OR EXISTS (SELECT 1 FROM app.tbcofirm c WHERE c.idiw37 = vo.idiw37)
             OR EXISTS (SELECT 1 FROM app.tbwrkclose w WHERE w.idiw37 = vo.idiw37)
           ) AS qc_ready
    FROM app.view_order vo
    JOIN app.tbiw37n i ON i.idiw37 = vo.idiw37
    WHERE ${sqlFactoryScope('vo', '$1')}
      AND vo.bscstart IS NOT NULL
      AND vo.bscstart > 0`

  sql += appendInFilter('vo.mat', expandActivityFilterCodes(body.activity), params)
  sql += appendWorkTypeFilter('vo', body.wktype, params, appendInFilter)
  sql += appendInFilter('vo.syst', body.status, params)
  sql += appendInFilter('vo.wkctr', body.wkctr, params)
  sql += appendInFilter('vo.functionalloc', body.functionalloc, params)
  sql += appendInFilter('vo.equipment', body.equipment, params)
  sql += appendTeamFilterVo(body.team, params)

  const fromSec = body.fromDate ? parseIsoYyyyMmDdToSec(body.fromDate) : null
  const toSec = body.toDate ? parseIsoYyyyMmDdToSec(body.toDate) : null
  if (fromSec != null || toSec != null) {
    const startSec = Math.min(fromSec ?? toSec ?? 0, toSec ?? fromSec ?? 0)
    const endSec = Math.max(fromSec ?? toSec ?? 0, toSec ?? fromSec ?? 0) + 86400
    params.push(startSec, endSec)
    const a = params.length - 1
    const b = params.length
    sql += `
      AND (
        (vo.bscstart >= $${a} AND vo.bscstart < $${b})
        OR (vo.actfinish >= $${a} AND vo.actfinish < $${b})
        OR (vo.cday >= $${a} AND vo.cday < $${b})
      )`
  }

  if (body.q?.trim()) {
    params.push(`%${body.q.trim()}%`)
    const i = params.length
    sql += ` AND (
      vo.wkorder ILIKE $${i}
      OR vo.operationshorttext ILIKE $${i}
      OR vo.equdescrip ILIKE $${i}
      OR vo.funcdescrip ILIKE $${i}
    )`
  }

  sql += ` ORDER BY COALESCE(vo.actfinish, vo.cday, vo.bscstart) DESC NULLS LAST LIMIT 2000`

  const r = await pool.query<SearchRow>(sql, params)
  return r.rows.map((row) => {
    const actfinish =
      row.actfinish != null && row.actfinish !== '' ? Number(row.actfinish) : null
    const cday = row.cday != null && row.cday !== '' ? Number(row.cday) : null
    const bscstart =
      row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
    const displayUnix =
      actfinish != null && actfinish > 0
        ? actfinish
        : cday != null && cday > 0
          ? cday
          : bscstart != null && bscstart > 0
            ? bscstart
            : 0
    const displayDate = displayUnix > 0 ? unixToDateString(displayUnix) : ''
    const syst = row.syst?.trim() ?? ''
    const qcRaw = row.confirm_qc_status?.trim().toLowerCase() ?? ''
    const confirmQcStatus =
      qcRaw === 'pending' || qcRaw === 'approved' || qcRaw === 'rejected' ? qcRaw : null
    return {
      id: String(row.idiw37),
      wkorder: row.wkorder,
      mntplan: row.mntplan?.trim() ?? '',
      wktype: row.wktype?.trim() ?? '',
      mat: row.mat?.trim() ?? '',
      equdescrip: row.equdescrip?.trim() ?? '',
      funcdescrip: row.funcdescrip?.trim() ?? '',
      work: row.work != null && row.work !== '' ? Number(row.work) || 0 : 0,
      untime: row.untime != null && row.untime !== '' ? String(row.untime) : '',
      displayDate,
      team: row.team?.trim() ?? '',
      wkstcolor: row.wkstcolor?.trim() ?? '#6b7280',
      operationshorttext: row.operationshorttext?.trim() ?? '',
      syst,
      pmPhase: resolveWoPmPhase(syst),
      confirmQcStatus,
      qcReadyForReview: Boolean(row.qc_ready),
    }
  })
}

/** สรุปตัวกรอง + Team A/B/P */
export async function getWorkOrderFilterDetail(
  pool: Pool,
  body: WorkOrderSearch,
): Promise<WorkOrderFilterDetail> {
  const factory = `%${FACTORY_CODE}%`
  const params: unknown[] = [factory]
  let where = `
    FROM app.view_order
    WHERE ${sqlFactoryScope('', '$1')}
      AND bscstart IS NOT NULL
      AND bscstart > 0`

  where += appendInFilter('mat', expandActivityFilterCodes(body.activity), params)
  where += appendWorkTypeFilter('', body.wktype, params, appendInFilter)
  where += appendInFilter('syst', body.status, params)
  where += appendInFilter('wkctr', body.wkctr, params)
  where += appendInFilter('functionalloc', body.functionalloc, params)
  where += appendInFilter('equipment', body.equipment, params)
  where += appendTeamFilter(body.team, params)

  const fromSec = body.fromDate ? parseIsoYyyyMmDdToSec(body.fromDate) : null
  const toSec = body.toDate ? parseIsoYyyyMmDdToSec(body.toDate) : null
  if (fromSec != null || toSec != null) {
    const startSec = Math.min(fromSec ?? toSec ?? 0, toSec ?? fromSec ?? 0)
    const endSec = Math.max(fromSec ?? toSec ?? 0, toSec ?? fromSec ?? 0) + 86400
    params.push(startSec, endSec)
    const a = params.length - 1
    const b = params.length
    where += `
      AND (
        (bscstart >= $${a} AND bscstart < $${b})
        OR (actfinish >= $${a} AND actfinish < $${b})
        OR (cday >= $${a} AND cday < $${b})
      )`
  }

  if (body.q?.trim()) {
    params.push(`%${body.q.trim()}%`)
    const i = params.length
    where += ` AND (
      wkorder ILIKE $${i}
      OR operationshorttext ILIKE $${i}
      OR equdescrip ILIKE $${i}
      OR funcdescrip ILIKE $${i}
    )`
  }

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
       COUNT(*) FILTER (WHERE syst NOT IN ('CRTD', 'REL'))::text AS completion_count,
       COUNT(*) FILTER (WHERE team = 'A')::text AS team_a_count,
       COALESCE(SUM(COALESCE(work, 0)) FILTER (WHERE team = 'A'), 0)::text AS team_a_work,
       COUNT(*) FILTER (WHERE team = 'B')::text AS team_b_count,
       COALESCE(SUM(COALESCE(work, 0)) FILTER (WHERE team = 'B'), 0)::text AS team_b_work,
       COUNT(*) FILTER (WHERE team = 'EE')::text AS team_ee_count,
       COALESCE(SUM(COALESCE(work, 0)) FILTER (WHERE team = 'EE'), 0)::text AS team_ee_work,
       COUNT(*) FILTER (WHERE team = 'UT')::text AS team_ut_count,
       COALESCE(SUM(COALESCE(work, 0)) FILTER (WHERE team = 'UT'), 0)::text AS team_ut_work
     ${where}`,
    params,
  )

  const totalOrders = Number(totalsR.rows[0]?.total_orders ?? 0) || 0
  const completionCount = Number(totalsR.rows[0]?.completion_count ?? 0) || 0
  const completionPercent =
    totalOrders > 0 ? Math.round((completionCount / totalOrders) * 100) : 0

  const byWkzbR = await pool.query<{
    wkzb: string
    zbdescrip: string | null
    cnt: string
  }>(
    `SELECT z.wkzb, z.zbdescrip, COALESCE(x.cnt, 0)::text AS cnt
     FROM app.tbwkzb z
     LEFT JOIN (
       SELECT wktype, COUNT(*)::int AS cnt
       ${where}
       GROUP BY wktype
     ) x ON x.wktype = z.wkzb
     ORDER BY z.wkzb`,
    params,
  )

  return {
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

export async function updateWorkOrderTeam(
  pool: Pool,
  id: string,
  team: string,
): Promise<boolean> {
  const idiw37 = Number(id)
  if (!Number.isFinite(idiw37)) return false
  const factory = `%${FACTORY_CODE}%`
  const r = await pool.query(
    `UPDATE app.tbiw37n SET team = $2
     WHERE idiw37 = $1 AND ${sqlFactoryScope('', '$3')}`,
    [idiw37, team || null, factory],
  )
  return (r.rowCount ?? 0) > 0
}

export type WorkOrderTeamChange = {
  id: string
  from: string | null
  to: string | null
}

export type WorkOrderTeamBulkResult = {
  team: PmPlanTeamField
  updated: string[]
  notFound: string[]
  /** ค่า team ก่อน/หลังต่อ WO ที่อัปเดตสำเร็จ — ใช้ audit log */
  changes: WorkOrderTeamChange[]
}

/**
 * ตั้ง team หลาย WO ในคำขอเดียว (bulk team assign).
 * รับ `idiw37` เป็นตัวเลขใน `ids` เท่านั้น — dedupe และจำกัดที่ caller/schema.
 */
export async function updateWorkOrderTeamBatch(
  pool: Pool,
  ids: string[],
  team: PmPlanTeamField,
): Promise<WorkOrderTeamBulkResult> {
  const seen = new Set<string>()
  const idNums: number[] = []
  const invalid: string[] = []

  for (const raw of ids) {
    const id = raw.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const n = Number(id)
    if (!Number.isFinite(n) || n <= 0) {
      invalid.push(id)
      continue
    }
    idNums.push(n)
  }

  if (idNums.length === 0) {
    return { team, updated: [], notFound: [...invalid, ...seen], changes: [] }
  }

  const factory = `%${FACTORY_CODE}%`
  const beforeR = await pool.query<{ idiw37: string; team: string | null }>(
    `SELECT idiw37::text AS idiw37, team
     FROM app.tbiw37n
     WHERE idiw37 = ANY($1::bigint[])
       AND ${sqlFactoryScope('', '$2')}`,
    [idNums, factory],
  )
  const beforeById = new Map(
    beforeR.rows.map((row) => [row.idiw37, row.team?.trim() || null] as const),
  )

  const r = await pool.query<{ idiw37: string }>(
    `UPDATE app.tbiw37n SET team = $1
     WHERE idiw37 = ANY($2::bigint[])
       AND ${sqlFactoryScope('', '$3')}
     RETURNING idiw37::text AS idiw37`,
    [team || null, idNums, factory],
  )

  const updatedSet = new Set(r.rows.map((row) => row.idiw37))
  const updated = [...updatedSet]
  const toTeam = team || null
  const changes: WorkOrderTeamChange[] = updated.map((id) => ({
    id,
    from: beforeById.get(id) ?? null,
    to: toTeam,
  }))
  const notFound = [
    ...invalid,
    ...[...seen].filter((id) => {
      const n = Number(id)
      return Number.isFinite(n) && n > 0 && !updatedSet.has(String(n))
    }),
  ]

  return { team, updated, notFound, changes }
}

type ViewOrderRow = Iw37Row & {
  wkorder: string
  team: string | null
  mat: string | null
  cday: string | number | null
  wkstcolor: string | null
  mpcount: number | null
  reasoncode: string | null
  reasonname: string | null
  mwkctr: string | null
  resoncom: string | null
}

export async function getWorkOrderById(
  pool: Pool,
  id: string,
): Promise<WorkOrderListItem | null> {
  const detail = await getWorkOrderViewRow(pool, id)
  if (!detail) return null
  return mapRow(detail)
}

export async function resolveWorkOrderIdiw37(pool: Pool, id: string): Promise<number | null> {
  const row = await getWorkOrderViewRow(pool, id)
  return row ? Number(row.idiw37) : null
}

async function getWorkOrderViewRow(
  pool: Pool,
  id: string,
): Promise<ViewOrderRow | null> {
  const r = await pool.query<ViewOrderRow>(
    `SELECT i.idiw37, i.wkorder, i.mntplan, i.wktype, i.equipment, i.equdescrip, i.functionalloc, i.funcdescrip,
            i.untime, i.syst, i.bscstart, i.actfinish, i.systemstatus, i.wkctr, i.operationshorttext,
            i.ostdescription, i.opac, i.work, i.actwork, i.team, i.mat,
            v.cday, v.wkstcolor,
            mp.mpcount, mp.reasoncode, mp.mwkctr, mp.resoncom,
            r.reasonname
     FROM app.tbiw37n i
     JOIN app.view_order v ON v.idiw37 = i.idiw37
     LEFT JOIN app.tbmoveplan mp ON mp.idiw37 = i.idiw37
     LEFT JOIN app.tbreason r ON r.reasoncode = mp.reasoncode
     WHERE (i.idiw37::text = $1 OR i.wkorder = $1)
       AND ${sqlFactoryScope('i', '$2')}
     LIMIT 1`,
    [id, `%${FACTORY_CODE}%`],
  )
  return r.rows[0] ?? null
}

async function getResourcesLabel(pool: Pool, wkctr: string): Promise<string> {
  const code = wkctr.trim()
  if (!code) return ''
  const g = await pool.query<{ wkctrdescription: string | null }>(
    `SELECT wkctrdescription FROM app.tbwkctrgroup WHERE wkctrgroup = $1 LIMIT 1`,
    [code],
  )
  const fromGroup = g.rows[0]?.wkctrdescription?.trim()
  if (fromGroup) return fromGroup
  const wc = await pool.query<{ namewkctr: string | null; surnamewkctr: string | null }>(
    `SELECT namewkctr, surnamewkctr FROM app.tbworkcenter WHERE wkctr = $1 LIMIT 1`,
    [code],
  )
  const row = wc.rows[0]
  if (!row) return ''
  return `คุณ${row.namewkctr ?? ''} ${row.surnamewkctr ?? ''}`.trim()
}

function toNumberField(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function enrichWorkOrderDetail(pool: Pool, id: string) {
  const row = await getWorkOrderViewRow(pool, id)
  if (!row) return null
  const item = mapRow(row)
  const resourcesLabel = await getResourcesLabel(pool, row.wkctr?.trim() ?? '')
  const syst = (row.syst ?? '').trim()
  const canMovePlan = isPlanMovableStatus(syst)
  const cday = row.cday != null && row.cday !== '' ? Number(row.cday) : 0

  const movePlan =
    cday > 0 && row.mpcount != null
      ? {
          movedDate: formatUnixDate(row.cday),
          moveCount: row.mpcount,
          reasonCode: row.reasoncode?.trim() ?? '',
          reasonName: row.reasonname?.trim() ?? row.reasoncode?.trim() ?? '',
          movedByWkctr: row.mwkctr?.trim() ?? '',
          comment: row.resoncom?.trim() ?? '',
        }
      : null

  const idiw37 = Number(row.idiw37)
  const workflowSteps = await getWorkOrderWorkflowSteps(pool, idiw37)
  const confirmQc = await getConfirmQcSnapshot(pool, idiw37)

  return {
    ...item,
    pmPhase: resolveWoPmPhase(syst),
    wkorder: row.wkorder,
    team: row.team?.trim() ?? '',
    mat: row.mat?.trim() ?? '',
    mntplan: row.mntplan?.trim() ?? '',
    opac: row.opac?.trim() ?? '',
    work: toNumberField(row.work),
    actwork: toNumberField(row.actwork),
    untime: row.untime != null && row.untime !== '' ? String(row.untime) : '',
    resourcesLabel,
    plannedDate: unixToIsoDate(row.bscstart),
    finishDate: unixToIsoDate(row.actfinish),
    statusColor: row.wkstcolor?.trim() ?? '#6b7280',
    canMovePlan,
    movePlan,
    workflow: {
      steps: workflowSteps,
      suffix: workflowSuffixFromSteps(workflowSteps),
    },
    confirmQc: confirmQc
      ? {
          status: confirmQc.status,
          statusLabel: confirmQc.statusLabel,
          reviewedAt: confirmQc.reviewedAt,
          reviewedBy: confirmQc.reviewedBy,
          note: confirmQc.note,
          imageCount: confirmQc.imageCount,
          imageBefore: confirmQc.imageBefore,
          imageAfter: confirmQc.imageAfter,
          closeCount: confirmQc.closeCount,
          worktimeCount: confirmQc.worktimeCount,
          readyForReview: confirmQc.readyForReview,
          approved: confirmQc.approved,
        }
      : {
          status: null,
          statusLabel: 'ยังไม่ส่งตรวจ',
          reviewedAt: null,
          reviewedBy: null,
          note: null,
          imageCount: 0,
          imageBefore: 0,
          imageAfter: 0,
          closeCount: 0,
          worktimeCount: 0,
          readyForReview: false,
          approved: false,
        },
    operations: [
      {
        no: item.orderType ? '0010' : '—',
        desc: item.title,
        wc: item.workCenter,
        hours: Number(item.priority) || 0,
      },
    ],
    components: [] as { material: string; qty: number; unit: string }[],
  }
}

export async function enrichWorkOrderDetailForUser(
  pool: Pool,
  id: string,
  userst: string | undefined,
) {
  const base = await enrichWorkOrderDetail(pool, id)
  if (!base) return null
  const role = (userst ?? '').trim()
  const movable = isPlanMovableStatus(base.status) && (role === 'A' || role === 'H')
  return { ...base, canMovePlan: movable }
}

function isoToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type ModalDetailTaskRow = {
  tasklist: string
  legacy: string
  machine: string
  pmlist: string
  machinestatus: number | null
  pmman: number | string | null
  pmday: number | null
  mat: string | null
  matdescrip: string | null
  mpoint: string | null
  ment: string | null
  idzone: string
  zone: string | null
  idwkctrtype: string
  wkctrtype: string | null
  idproductline: string | null
  prolinedescrip: string | null
}

type MachineRow = { machine: string }

type LineRow = { productline: string | null; uptime: string | number | null }

type MaterialRow = {
  matpo: string | null
  pstngdate: string | null
  materialdesc: string | null
  amountinlc: number | string | null
  mvt: string | null
  material: string | null
}

type PlanningGroupRow = { wkctrgroup: string; wkctrdescription: string | null }

type PlanningAssignedRow = {
  idplanw: number | null
  wkctr: string | null
  pwcomment: string | null
  pwteam: string | null
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  wkctrdescription: string | null
  wkctrtype: string | null
  position: string | null
}

export async function getWorkOrderModalDetail(
  pool: Pool,
  id: string,
  opts: { date?: string },
  auth: { userst?: string; wkctr?: string } | undefined,
) {
  const userst = auth?.userst
  const row = await getWorkOrderViewRow(pool, id)
  if (!row) return null

  const planned = unixToIsoDate(row.bscstart)
  const date = opts.date?.trim() || planned || isoToday()
  const lineday = parseIsoYyyyMmDdToSec(date) ?? 0

  const mntplan = row.mntplan?.trim() ?? ''

  const taskR =
    mntplan && mntplan !== '-'
      ? await pool.query<ModalDetailTaskRow>(
          `SELECT tl.tasklist, tl.legacy, tl.machine, tl.pmlist, tl.machinestatus,
                  tl.pmman, tl.pmday,
                  tl.mat, at.matdescrip,
                  tl.mpoint, tl.ment,
                  tl.idzone, z.zone, tl.idwkctrtype, wt.wkctrtype,
                  z.idproductline, pl.prolinedescrip
           FROM app.tbtasklist tl
           LEFT JOIN app.tbactivitytype at ON at.mat = tl.mat
           LEFT JOIN app.tbzone z ON z.idzone = tl.idzone
           LEFT JOIN app.tbwkctrtype wt ON wt.idwkctrtype = tl.idwkctrtype
           LEFT JOIN app.tbproductline pl ON pl.productline = z.idproductline
           WHERE tl.mntplan = $1
           ORDER BY tl.tasklist ASC, tl.machine ASC, tl.pmlist ASC
           LIMIT 2000`,
          [mntplan],
        )
      : { rows: [] as ModalDetailTaskRow[] }

  const taskRows = taskR.rows
  const firstTask = taskRows[0]
  const mapTaskLike = (r: ModalDetailTaskRow) => ({
    mat: r.mat,
    matdescrip: r.matdescrip,
    idwkctrtype: r.idwkctrtype,
    wkctrtype: r.wkctrtype,
    legacy: r.legacy,
    zone: r.zone,
    machine: r.machine,
    pmlist: r.pmlist,
    pmman: r.pmman,
    machinestatus: r.machinestatus,
    pmday: r.pmday,
  })
  const summary = firstTask
    ? {
        tasklist: firstTask.tasklist,
        legacy: firstTask.legacy?.trim() ?? '',
        productline:
          firstTask.idproductline && firstTask.prolinedescrip
            ? `${firstTask.idproductline} = ${firstTask.prolinedescrip}`
            : firstTask.idproductline || firstTask.prolinedescrip || '',
        zone:
          firstTask.idzone && firstTask.zone
            ? `${firstTask.idzone} = ${firstTask.zone}`
            : firstTask.idzone || firstTask.zone || '',
        wkctrtype:
          firstTask.idwkctrtype && firstTask.wkctrtype
            ? `${firstTask.idwkctrtype} = ${firstTask.wkctrtype}`
            : firstTask.idwkctrtype || firstTask.wkctrtype || '',
      }
    : null

  const zoneCode = firstTask?.idzone ?? ''
  const typeCode = firstTask?.idwkctrtype ?? ''
  const plCode = firstTask?.idproductline ?? null

  const machinesR =
    zoneCode && typeCode
      ? await pool.query<MachineRow>(
          `SELECT machine
           FROM app.tbmainteanance
           WHERE idzone = $1 AND idwkctrtype = $2
           ORDER BY machine ASC`,
          [zoneCode, typeCode],
        )
      : { rows: [] as MachineRow[] }

  const lineR =
    plCode && lineday > 0
      ? await pool.query<LineRow>(
          `SELECT productline, uptime
           FROM app.tblineschdul
           WHERE idproductline = $1 AND lineday = $2
           LIMIT 1`,
          [plCode, lineday],
        )
      : { rows: [] as LineRow[] }

  const line = lineR.rows[0]
  const uptime =
    line?.uptime != null && line.uptime !== '' ? Number(line.uptime) : null

  const matR = await pool.query<MaterialRow>(
    `SELECT matpo, pstngdate::text AS pstngdate, materialdesc, amountinlc::float8 AS amountinlc, mvt, material
     FROM app.tbmaterial
     WHERE wkorder = $1
     ORDER BY pstngdate DESC NULLS LAST, idmaterial DESC
     LIMIT 500`,
    [row.wkorder],
  )

  const groupsR = await pool.query<PlanningGroupRow>(
    `SELECT wkctrgroup, wkctrdescription
     FROM app.tbwkctrgroup
     ORDER BY wkctrgroup ASC`,
  )

  const wcR = await pool.query<{
    wkctr: string
    titlewkctr: string | null
    namewkctr: string | null
    surnamewkctr: string | null
    cat: string | null
    idwkctrtype: string | null
    wkctrtype_label: string | null
  }>(
    `SELECT wc.wkctr, wc.titlewkctr, wc.namewkctr, wc.surnamewkctr, wc.cat, wc.idwkctrtype,
            wt.wkctrtype AS wkctrtype_label
     FROM app.tbworkcenter wc
     LEFT JOIN app.tbwkctrtype wt ON wt.idwkctrtype::text = wc.idwkctrtype::text
     LEFT JOIN app.tbwkctrstatus ws ON ws.workstatus = wc.workstatus
     WHERE COALESCE(wc.userrole, '') <> 'admin'
       AND COALESCE(UPPER(wc.userst), '') <> 'A'
       AND (ws.is_active IS DISTINCT FROM false)
     ORDER BY wc.wkctr ASC`,
  )

 // Multi-assign
  const assignedR = await pool.query<
    PlanningAssignedRow & {
      ack_status?: string | null
      ack_at?: Date | null
      ack_channel?: string | null
    }
  >(
    `SELECT mp.idplanw, mp.wkctr, mp.pwcomment, mp.pwteam,
            mp.ack_status, mp.ack_at, mp.ack_channel,
            wc.titlewkctr, wc.namewkctr, wc.surnamewkctr,
            wt.wkctrtype,
            pos.position,
            g.wkctrdescription
     FROM app.tbplangingwork mp
     LEFT JOIN app.tbworkcenter wc ON wc.wkctr = mp.wkctr
     LEFT JOIN app.tbwkctrtype wt ON wt.idwkctrtype::text = wc.idwkctrtype::text
     LEFT JOIN app.tbposition pos ON pos.idposition::text = wc.idposition::text
     LEFT JOIN app.tbwkctrgroup g ON g.wkctrgroup = mp.wkctr
     WHERE mp.idiw37 = $1
     ORDER BY mp.idplanw ASC`,
    [row.idiw37],
  )

  const assignees = assignedR.rows
    .filter((r) => r.wkctr)
    .map((r) => {
      const pwteam = r.pwteam?.trim() ?? ''
      const isGroupRow = pwteam === 'G'
      return {
        idplanw: r.idplanw != null ? Number(r.idplanw) : null,
        kind: isGroupRow ? ('group' as const) : ('person' as const),
        code: r.wkctr as string,
        displayName:
          r.titlewkctr || r.namewkctr || r.surnamewkctr
            ? `${r.titlewkctr ?? ''}${r.namewkctr ?? ''} ${r.surnamewkctr ?? ''}`.trim()
            : r.wkctrdescription?.trim() || (r.wkctr as string),
        wkctrtype: r.wkctrtype?.trim() ?? '',
        position: r.position?.trim() ?? '',
        pwcomment: r.pwcomment?.trim() ?? '',
        pwteam,
        ackStatus:
          r.ack_status === 'pending' ||
          r.ack_status === 'acknowledged' ||
          r.ack_status === 'declined'
            ? (r.ack_status as 'pending' | 'acknowledged' | 'declined')
            : undefined,
        ackAt: r.ack_at?.toISOString() ?? null,
        ackChannel:
          r.ack_channel === 'telegram' || r.ack_channel === 'web'
            ? (r.ack_channel as 'telegram' | 'web')
            : null,
      }
    })

  // back-compat: คงฟิลด์ `assigned` (ช่างคนแรก) สำหรับ client เก่า
  const assigned = assignees[0] ?? null

  const canAssign =
    !!userst?.trim() && (await hasPermission(pool, userst, 'planning.assign'))

  const hasConfirmWrite =
    !!userst?.trim() && (await hasPermission(pool, userst, 'confirmation.write'))

  const canEditPmExecution = hasConfirmWrite

  const pmExecution = await loadWoPmExecution(pool, Number(row.idiw37), canEditPmExecution)

  const { resolveCloseWoAccess } = await import('../lib/close-wo-access.js')
  const closeWoAccess = resolveCloseWoAccess({
    assignees,
    wkctr: auth?.wkctr,
    userst,
    hasConfirmWrite,
  })

  const hoursMap = await loadPlanningAvailableHoursByWkctr(pool, date, {
    excludeIdiw37: Number(row.idiw37),
  })
  const workcentersWithHours = mergeWorkcenterAvailableHours(
    wcR.rows.map((w) => {
      const tags = derivePlanningWorkcenterTags({
        cat: w.cat,
        wkctrtype: w.wkctrtype_label,
        idwkctrtype: w.idwkctrtype,
      })
      return {
        wkctr: w.wkctr,
        displayName: `${w.titlewkctr ?? ''}${w.namewkctr ?? ''} ${w.surnamewkctr ?? ''}`.trim(),
        shiftTags: tags.shiftTags.length > 0 ? tags.shiftTags : undefined,
        craftTags: tags.craftTags.length > 0 ? tags.craftTags : undefined,
      }
    }),
    hoursMap,
  )

  const taskItems = taskRows.map((r) => {
    const machine = r.machine?.trim() ?? ''
    const pmlist = r.pmlist?.trim() ?? ''
    const measure = buildTaskMeasurementFields({
      pmlist: r.pmlist,
      mpoint: r.mpoint,
      ment: r.ment,
    })
    return {
      tasklist: r.tasklist?.trim() ?? '',
      machine: r.machine?.trim() ?? '',
      pmlist: r.pmlist?.trim() ?? '',
      displayLine: machine && pmlist ? `${machine} — ${pmlist}` : machine || pmlist || '—',
      machinestatus: r.machinestatus != null ? Number(r.machinestatus) : null,
      pmman: (() => {
        if (r.pmman == null || r.pmman === '') return null
        const n = Number(r.pmman)
        return Number.isFinite(n) ? n : null
      })(),
      pmday: r.pmday != null ? Number(r.pmday) : null,
      mat: r.mat?.trim() ?? '',
      matdescrip: r.matdescrip?.trim() ?? '',
      ...measure,
    }
  })

  const dataReadiness = buildPmDataReadiness({
    mntplan,
    tasks: taskItems,
    readingCount: pmExecution.readings.length,
  })

  const page2Form = await loadWoPmPage2Form(pool, Number(row.idiw37))

  return {
    date,
    woHeader: buildWoPmFormHeader(row, {
      firstTask: firstTask ? mapTaskLike(firstTask) : null,
      allTasks: taskRows.map(mapTaskLike),
      materialCount: matR.rows.length,
    }),
    taskList: {
      mntplan,
      summary,
      items: taskItems,
    },
    pmExecution,
    page2Form,
    dataReadiness,
    machine: {
      zone: summary?.zone ?? '',
      wkctrtype: summary?.wkctrtype ?? '',
      productline: summary?.productline ?? '',
      uptime,
      machines: machinesR.rows.map((x) => x.machine),
    },
    planning: {
      canAssign,
      assigned,
      assignees,
      workcenters: workcentersWithHours,
      groups: groupsR.rows.map((g) => ({
        wkctrgroup: g.wkctrgroup,
        wkctrdescription: g.wkctrdescription?.trim() ?? '',
      })),
      closeWoAccess,
    },
    materials: {
      items: matR.rows.map((m) => ({
        matpo: m.matpo?.trim() ?? '',
        pstngdate: m.pstngdate?.trim() ?? '',
        materialdesc: m.materialdesc?.trim() ?? '',
        amountinlc: m.amountinlc != null && m.amountinlc !== '' ? Number(m.amountinlc) : 0,
        mvt: m.mvt?.trim() ?? '',
        material: m.material?.trim() ?? '',
      })),
    },
  }
}

/**
 * เพิ่ม assignment ของ WO — multi-assign:
 *   - mode='P' → INSERT (idiw37, wkctr) 1 แถว
 * - mode='G' → expand เป็นช่างทั้งกลุ่ม
 *   - ON CONFLICT (idiw37, wkctr) DO NOTHING → ไม่ทับ comment เดิม
 */
export async function upsertWorkOrderPlanning(
  pool: Pool,
  id: string,
  body: { mode: 'P' | 'G'; code: string; comment?: string },
  actorWkctr: string,
): Promise<boolean> {
  const row = await getWorkOrderViewRow(pool, id)
  if (!row) return false
  const code = body.code.trim()
  if (!code) return false

  const dayNow = Math.floor(Date.now() / 1000)

  if (body.mode === 'G') {
    const memberCodes = await loadWorkcenterCodesForPlanningGroup(pool, code)
    if (memberCodes.length === 0) return false
    for (const wkctr of memberCodes) {
      await pool.query(
        `INSERT INTO app.tbplangingwork (idiw37, wkctr, wkctrpw, pwcomment, pwteam)
         VALUES ($1, $2, $3, $4, 'G')
         ON CONFLICT (idiw37, wkctr) DO NOTHING`,
        [row.idiw37, wkctr, actorWkctr, String(dayNow)],
      )
    }
    return true
  }

  await pool.query(
    `INSERT INTO app.tbplangingwork (idiw37, wkctr, wkctrpw, pwcomment, pwteam)
     VALUES ($1, $2, $3, $4, 'P')
     ON CONFLICT (idiw37, wkctr) DO NOTHING`,
    [row.idiw37, code, actorWkctr, body.comment?.trim() || String(dayNow)],
  )
  return true
}

/**
 * Multi-assign แบบ batch — ส่ง wkctr หลายคนในคำขอเดียว
 *   - ใช้ ON CONFLICT (idiw37, wkctr) DO NOTHING เพื่อข้ามคนที่จ่ายไปแล้ว
 *   - คืน `assigned[]` (เพิ่มสำเร็จ) และ `skipped[]` (มีอยู่แล้ว)
 *   - dedupe wkctr ในฝั่ง backend อีกชั้น (กัน frontend ส่งซ้ำ)
 *   - กรอง wkctr ที่ไม่อยู่ใน tbworkcenter (กันส่ง code มั่ว)
 */
export async function assignWorkOrderPlanningBatch(
  pool: Pool,
  id: string,
  wkctrs: string[],
  comment: string | undefined,
  actorWkctr: string,
): Promise<{ assigned: string[]; skipped: string[]; notFound: string[] } | null> {
  const row = await getWorkOrderViewRow(pool, id)
  if (!row) return null

  const dedup = Array.from(
    new Set(
      wkctrs
        .map((c) => (c ?? '').trim())
        .filter((c) => c.length > 0),
    ),
  )
  if (dedup.length === 0) {
    return { assigned: [], skipped: [], notFound: [] }
  }

  // ตรวจ wkctr มีจริงไหม
  const checkRes = await pool.query<{ wkctr: string }>(
    `SELECT wkctr FROM app.tbworkcenter WHERE wkctr = ANY($1::text[])`,
    [dedup],
  )
  const valid = new Set(checkRes.rows.map((r) => r.wkctr))
  const notFound = dedup.filter((c) => !valid.has(c))
  const validCodes = dedup.filter((c) => valid.has(c))

  if (validCodes.length === 0) {
    return { assigned: [], skipped: [], notFound }
  }

  // หาว่ามีใครจ่ายไปแล้ว (skip)
  const existsRes = await pool.query<{ wkctr: string }>(
    `SELECT wkctr FROM app.tbplangingwork
     WHERE idiw37 = $1 AND wkctr = ANY($2::text[])`,
    [row.idiw37, validCodes],
  )
  const alreadyAssigned = new Set(existsRes.rows.map((r) => r.wkctr))

  const toAssign = validCodes.filter((c) => !alreadyAssigned.has(c))
  const skipped = validCodes.filter((c) => alreadyAssigned.has(c))

  const trimmedComment = comment?.trim()
  const dayNow = Math.floor(Date.now() / 1000)
  const pwcomment = trimmedComment && trimmedComment.length > 0 ? trimmedComment : String(dayNow)

  if (toAssign.length > 0) {
    // ใช้ UNNEST เพื่อ insert ทีเดียวหลายแถว — เร็วกว่า loop
    await pool.query(
      `INSERT INTO app.tbplangingwork (idiw37, wkctr, wkctrpw, pwcomment, pwteam)
       SELECT $1, w, $2, $3, 'P'
       FROM UNNEST($4::text[]) AS w
       ON CONFLICT (idiw37, wkctr) DO NOTHING`,
      [row.idiw37, actorWkctr, pwcomment, toAssign],
    )
  }

  return { assigned: toAssign, skipped, notFound }
}

/**
 * ลบ assignment ของ WO:
 * - ถ้าระบุ `wkctr` → ลบเฉพาะคู่ (idiw37, wkctr)
 *   - ถ้าไม่ระบุ → ลบทั้งหมดของ WO (รีเซ็ตการมอบหมาย — back-compat)
 */
export async function deleteWorkOrderPlanning(
  pool: Pool,
  id: string,
  wkctr?: string,
): Promise<boolean> {
  const row = await getWorkOrderViewRow(pool, id)
  if (!row) return false
  if (wkctr && wkctr.trim()) {
    const r = await pool.query(
      `DELETE FROM app.tbplangingwork WHERE idiw37 = $1 AND wkctr = $2`,
      [row.idiw37, wkctr.trim()],
    )
    return (r.rowCount ?? 0) > 0
  }
  const r = await pool.query(`DELETE FROM app.tbplangingwork WHERE idiw37 = $1`, [row.idiw37])
  return (r.rowCount ?? 0) > 0
}
