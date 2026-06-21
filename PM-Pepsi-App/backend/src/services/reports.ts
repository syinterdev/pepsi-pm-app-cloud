import type { Pool } from 'pg'
import { manhourOtNet, manhourSummaryW } from '../lib/manhour-minutes.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import { pepsiWorkWeekSql } from '../lib/pepsi-work-week.js'
import { getReportsImportCoverage } from '../lib/reports-import-coverage.js'
import {
  computeSummaryWeeklyPercents,
  resolveReportsRange,
  safeRatio,
  weekLabelsInRange,
  type ReportsDateRange,
} from '../lib/reports-range.js'
import {
  sqlWktypeInList,
  SUMMARY_WEEKLY_PM_WKTYPES,
  SUMMARY_WEEKLY_REACTIVE_WKTYPES,
} from '../lib/reports-wktype.js'
import { buildWeekToWeek } from '../lib/week-to-week.js'
import type { ReportsKpiResponse, SummaryWeeklyResponse } from '../schemas/reports.js'

const WEEK_LABEL_SQL = {
  manhours: pepsiWorkWeekSql('workday'),
  confirm: pepsiWorkWeekSql('endate'),
  backlog: pepsiWorkWeekSql('bscstart'),
} as const

export type { ReportsDateRange }

const ACTWORK_MINUTES_SQL = `CASE
  WHEN UPPER(TRIM(COALESCE(untime::text, ''))) = 'H' THEN COALESCE(actwork, 0) * 60
  ELSE COALESCE(actwork, 0)
END`

function toHoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

function parseRange(opts: {
  fromInput?: string
  toInput?: string
  weeksBack?: number
}): ReportsDateRange {
  try {
    return resolveReportsRange(opts)
  } catch {
    return resolveReportsRange({ weeksBack: opts.weeksBack ?? 8 })
  }
}

/**
 * KPI รายสัปดาห์ — utilization % และ backlog (ชม.) ต่อสัปดาห์ในช่วงที่เลือก
 */
export async function getReportsKpi(
  pool: Pool,
  opts: { fromInput?: string; toInput?: string; weeksBack?: number; team?: string } = {},
): Promise<ReportsKpiResponse> {
  const range = parseRange(opts)
  const labels = weekLabelsInRange(range)
  const team = opts.team && ['A', 'B', 'EE', 'UT'].includes(opts.team) ? opts.team : null

  const [mhRes, confirmRes, backlogRes] = await Promise.all([
    pool.query<{ week_label: string; total: string }>(
      `SELECT
         ${WEEK_LABEL_SQL.manhours} AS week_label,
         COALESCE(SUM(wh + ot1 + ot15 + ot1hol + ot2 + ot3), 0)::text AS total
       FROM app.tbmanhours m
       WHERE m.workday >= $1 AND m.workday <= $2
         AND (
           $3::text IS NULL OR EXISTS (
             SELECT 1
             FROM app.view_exportconfirm c
             INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
             INNER JOIN app.tbworkcenter wc ON wc.idwkctr = m.idwkctr
             WHERE c.wkctr = wc.wkctr
               AND c.endate >= $1 AND c.endate <= $2
               AND i.team = $3::text
           )
         )
       GROUP BY 1`,
      [range.from, range.to, team],
    ),
    pool.query<{ week_label: string; total: string }>(
      `SELECT
         ${WEEK_LABEL_SQL.confirm} AS week_label,
         COALESCE(SUM(timewk), 0)::text AS total
       FROM app.view_exportconfirm
       WHERE endate >= $1 AND endate <= $2
         AND ($3::text IS NULL OR team = $3::text)
       GROUP BY 1`,
      [range.from, range.to, team],
    ),
    pool.query<{ week_label: string; hours: string }>(
      `SELECT
         ${WEEK_LABEL_SQL.backlog} AS week_label,
         (COALESCE(SUM(${ACTWORK_MINUTES_SQL}), 0) / 60.0)::text AS hours
       FROM app.view_order
       WHERE syst IN ('CRTD', 'REL')
         AND ($3::text IS NULL OR team = $3::text)
         AND bscstart IS NOT NULL
         AND bscstart >= $1 AND bscstart <= $2
       GROUP BY 1`,
      [range.from, range.to, team],
    ),
  ])

  const mhMap = new Map(mhRes.rows.map((r) => [r.week_label, Number(r.total)]))
  const confirmMap = new Map(confirmRes.rows.map((r) => [r.week_label, Number(r.total)]))
  const backlogMap = new Map(backlogRes.rows.map((r) => [r.week_label, Number(r.hours)]))

  const utilization: number[] = []
  const backlogHours: number[] = []

  for (const label of labels) {
    const mh = mhMap.get(label) ?? 0
    const conf = confirmMap.get(label) ?? 0
    utilization.push(safeRatio(conf, mh))
    backlogHours.push(Math.round((backlogMap.get(label) ?? 0) * 100) / 100)
  }

  const weekToWeek = buildWeekToWeek(labels, utilization, backlogHours)

  return { range, labels, utilization, backlogHours, weekToWeek }
}

/**
 * สรุปรายสัปดาห์
 */
export async function getSummaryWeekly(
  pool: Pool,
  opts: { fromInput?: string; toInput?: string; weeksBack?: number; team?: string } = {},
): Promise<SummaryWeeklyResponse> {
  const range = parseRange(opts)
  const { from, to } = range
  const activeWc = personnelIsActiveSql('wc')
  const team = opts.team && ['A', 'B', 'EE', 'UT'].includes(opts.team) ? opts.team : null

  const [utilRes, mhRes, pmRes, reaRes, rcaRes, woRes] = await Promise.all([
    pool.query<{ idwkctr: string; wkctr: string; summary: string }>(
      `SELECT
         wc.idwkctr,
         wc.wkctr,
         COALESCE(SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3), 0)::text AS summary
       FROM app.tbmanhours m
       INNER JOIN app.tbworkcenter wc ON wc.idwkctr = m.idwkctr
       WHERE m.workday >= $1 AND m.workday <= $2
         AND ${activeWc}
         AND (
           $3::text IS NULL OR EXISTS (
             SELECT 1
             FROM app.view_exportconfirm c
             INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
             WHERE c.wkctr = wc.wkctr
               AND c.endate >= $1 AND c.endate <= $2
               AND i.team = $3::text
           )
         )
       GROUP BY wc.idwkctr, wc.wkctr
       ORDER BY SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3) DESC
       LIMIT 200`,
      [from, to, team],
    ),
    pool.query<{
      idwkctr: string
      wkctr: string
      display_name: string | null
      has_image: boolean
      wh: string
      ot1: string
      ot15: string
      ot1hol: string
      ot2: string
      ot3: string
    }>(
      `SELECT
         wc.idwkctr,
         wc.wkctr,
         NULLIF(TRIM(CONCAT(COALESCE(wc.titlewkctr,''), COALESCE(wc.namewkctr,''), ' ', COALESCE(wc.surnamewkctr,''))), '') AS display_name,
         (octet_length(wc.imgmember_data) > 0) AS has_image,
         COALESCE(SUM(m.wh), 0)::text AS wh,
         COALESCE(SUM(m.ot1), 0)::text AS ot1,
         COALESCE(SUM(m.ot15), 0)::text AS ot15,
         COALESCE(SUM(m.ot1hol), 0)::text AS ot1hol,
         COALESCE(SUM(m.ot2), 0)::text AS ot2,
         COALESCE(SUM(m.ot3), 0)::text AS ot3
       FROM app.tbmanhours m
       INNER JOIN app.tbworkcenter wc ON wc.idwkctr = m.idwkctr
       WHERE m.workday >= $1 AND m.workday <= $2
         AND ${activeWc}
         AND (
           $3::text IS NULL OR EXISTS (
             SELECT 1
             FROM app.view_exportconfirm c
             INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
             WHERE c.wkctr = wc.wkctr
               AND c.endate >= $1 AND c.endate <= $2
               AND i.team = $3::text
           )
         )
       GROUP BY wc.idwkctr, wc.wkctr, wc.titlewkctr, wc.namewkctr, wc.surnamewkctr, wc.imgmember_data`,
      [from, to, team],
    ),
    pool.query<{ wkctr: string; minutes: string; sample_act: string; sample_untime: string }>(
      `SELECT
         wkctr,
         COALESCE(SUM(${ACTWORK_MINUTES_SQL}), 0)::text AS minutes,
         COALESCE(MAX(actwork), 0)::text AS sample_act,
         COALESCE(MAX(untime::text), 'Min') AS sample_untime
       FROM app.view_order
       WHERE ${sqlWktypeInList(SUMMARY_WEEKLY_PM_WKTYPES)}
         AND ($3::text IS NULL OR team = $3::text)
         AND bscstart IS NOT NULL
         AND bscstart >= $1 AND bscstart <= $2
       GROUP BY wkctr`,
      [from, to, team],
    ),
    pool.query<{ wkctr: string; minutes: string; sample_act: string; sample_untime: string }>(
      `SELECT
         wkctr,
         COALESCE(SUM(${ACTWORK_MINUTES_SQL}), 0)::text AS minutes,
         COALESCE(MAX(actwork), 0)::text AS sample_act,
         COALESCE(MAX(untime::text), 'Min') AS sample_untime
       FROM app.view_order
       WHERE ${sqlWktypeInList(SUMMARY_WEEKLY_REACTIVE_WKTYPES)}
         AND ($3::text IS NULL OR team = $3::text)
         AND bscstart IS NOT NULL
         AND bscstart >= $1 AND bscstart <= $2
       GROUP BY wkctr`,
      [from, to, team],
    ),
    pool.query<{ wkctr: string; minutes: string }>(
      `SELECT c.wkctr, COALESCE(SUM(c.timewk), 0)::text AS minutes
       FROM app.view_confirmation c
       INNER JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
       WHERE c.endate >= $1 AND c.endate <= $2
         AND ($3::text IS NULL OR i.team = $3::text)
       GROUP BY c.wkctr`,
      [from, to, team],
    ),
    pool.query<{ wkctr: string; n: string }>(
      `SELECT wkctr, COUNT(DISTINCT idiw37)::text AS n
       FROM app.view_order
       WHERE wkctr IS NOT NULL AND trim(wkctr) <> ''
         AND ($3::text IS NULL OR team = $3::text)
         AND bscstart IS NOT NULL
         AND bscstart >= $1 AND bscstart <= $2
       GROUP BY wkctr`,
      [from, to, team],
    ),
  ])

  const utilizationChart = utilRes.rows.map((r) => ({
    idwkctr: r.idwkctr,
    wkctr: r.wkctr,
    summaryHours: Number(r.summary),
  }))

  const pmMap = new Map(pmRes.rows.map((r) => [r.wkctr, r]))
  const reaMap = new Map(reaRes.rows.map((r) => [r.wkctr, r]))
  const rcaMap = new Map(rcaRes.rows.map((r) => [r.wkctr, Number(r.minutes)]))
  const woMap = new Map(woRes.rows.map((r) => [r.wkctr, Number(r.n)]))

  const rows = mhRes.rows.map((row) => {
    const wh = Number(row.wh)
    const ot = manhourOtNet({
      ot1: Number(row.ot1),
      ot15: Number(row.ot15),
      ot1hol: Number(row.ot1hol),
      ot2: Number(row.ot2),
      ot3: Number(row.ot3),
    })
    const hrHour = manhourSummaryW({
      wh,
      ot1: Number(row.ot1),
      ot15: Number(row.ot15),
      ot1hol: Number(row.ot1hol),
      ot2: Number(row.ot2),
      ot3: Number(row.ot3),
    })

    const pm = pmMap.get(row.wkctr)
    const rea = reaMap.get(row.wkctr)
    const pmHours = toHoursFromMinutes(pm ? Number(pm.minutes) : 0)
    const reaHours = toHoursFromMinutes(rea ? Number(rea.minutes) : 0)
    const rcaHours = toHoursFromMinutes(rcaMap.get(row.wkctr) ?? 0)
    const percents = computeSummaryWeeklyPercents(hrHour, pmHours, reaHours, rcaHours)

    return {
      wkctr: row.wkctr,
      idwkctr: row.idwkctr,
      displayName: row.display_name,
      hasImage: Boolean(row.has_image),
      pmWork: pm ? Number(pm.sample_act) : 0,
      pmUnit: pm?.sample_untime?.trim() || 'Min',
      reactiveWork: rea ? Number(rea.sample_act) : 0,
      reactiveUnit: rea?.sample_untime?.trim() || 'Min',
      rcaWork: rcaHours,
      rcaUnit: 'Hr',
      woCount: woMap.get(row.wkctr) ?? 0,
      pmHours,
      reactiveHours: reaHours,
      hrHour,
      otHour: ot,
      ...percents,
    }
  })

  rows.sort((a, b) => b.hrHour - a.hrHour)

  const importCoverage = await getReportsImportCoverage(pool, range)

  return { range, utilizationChart, rows, importCoverage }
}
