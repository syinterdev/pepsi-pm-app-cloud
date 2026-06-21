import type { Pool } from 'pg'
import { resolveManhourChartRange, type ManhourChartRange } from './manhour-chart.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'

/** แถว manhour ช่วง stworkday–workday ทับซ้อนช่วงที่เลือก (เหมือน manhour chart) */
const MANHOUR_PERIOD_OVERLAP_SQL = 'stworkday <= $2 AND workday >= $1'

export type EngUtilizationDbRow = {
  idwkctr: string
  wkctr: string
  label: string
  displayName: string | null
  hasImage: boolean
  pmPercent: number
  reactivePercent: number
  totalPercent: number
  pmHours: number
  reactiveHours: number
  rcaHours: number
  hrHours: number
}

export type EngUtilizationDbResponse = {
  source: 'db'
  range: ManhourChartRange
  averagePercent: number
  rows: EngUtilizationDbRow[]
}

const HR_HOURS_SQL = `COALESCE(SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3), 0)`

/**
 * Daily utilization chart (PM-RA) from DB (no excel):
 * - PM = confirm hours of ZB02
 * - Reactive = confirm hours of ZB05
 * - RCA = confirm hours of ZB01 (not stacked in chart, but returned)
 * - HR = tbmanhours overlap with range (same logic as manhour chart)
 */
export async function getEngUtilizationDailyFromDb(
  pool: Pool,
  opts: { fromInput?: string; toInput?: string } = {},
): Promise<EngUtilizationDbResponse> {
  const range = resolveManhourChartRange(opts.fromInput, opts.toInput)
  const { from, to } = range

  const r = await pool.query<{
    idwkctr: string
    wkctr: string
    display_name: string | null
    has_image: boolean
    hr_hours: string
    pm_hours: string
    reactive_hours: string
    rca_hours: string
  }>(
    `WITH people AS (
       SELECT
         wc.idwkctr,
         wc.wkctr,
         NULLIF(TRIM(CONCAT(
           COALESCE(wc.titlewkctr,''),
           COALESCE(wc.namewkctr,''),
           ' ',
           COALESCE(wc.surnamewkctr,'')
         )), '') AS display_name,
         (octet_length(wc.imgmember_data) > 0) AS has_image
       FROM app.tbworkcenter wc
       WHERE ${personnelIsActiveSql('wc')}
         AND wc.userrole = 'technician'
     ),
     hr AS (
       SELECT
         m.idwkctr,
         ${HR_HOURS_SQL}::text AS hr_hours
       FROM app.tbmanhours m
       INNER JOIN people p ON p.idwkctr = m.idwkctr
       WHERE ${MANHOUR_PERIOD_OVERLAP_SQL}
       GROUP BY m.idwkctr
     ),
     conf AS (
       SELECT
         p.wkctr,
         COALESCE(SUM(CASE WHEN c.wktype = 'ZB02' THEN c.timewk ELSE 0 END), 0)::text AS pm_hours,
         COALESCE(SUM(CASE WHEN c.wktype = 'ZB05' THEN c.timewk ELSE 0 END), 0)::text AS reactive_hours,
         COALESCE(SUM(CASE WHEN c.wktype = 'ZB01' THEN c.timewk ELSE 0 END), 0)::text AS rca_hours
       FROM people p
       LEFT JOIN app.view_exportconfirm c
         ON c.wkctr = p.wkctr
        AND c.endate BETWEEN $1 AND $2
        AND c.wktype IN ('ZB01','ZB02','ZB05')
       GROUP BY p.wkctr
     )
     SELECT
       p.idwkctr,
       p.wkctr,
       p.display_name,
       p.has_image,
       COALESCE(hr.hr_hours, '0') AS hr_hours,
       COALESCE(conf.pm_hours, '0') AS pm_hours,
       COALESCE(conf.reactive_hours, '0') AS reactive_hours,
       COALESCE(conf.rca_hours, '0') AS rca_hours
     FROM people p
     LEFT JOIN hr ON hr.idwkctr = p.idwkctr
     LEFT JOIN conf ON conf.wkctr = p.wkctr
     ORDER BY p.wkctr ASC`,
    [from, to],
  )

  const rows: EngUtilizationDbRow[] = r.rows.map((row) => {
    const wkctr = String(row.wkctr)
    const hrHours = Number(row.hr_hours ?? 0)
    const pmHours = Number(row.pm_hours ?? 0)
    const reactiveHours = Number(row.reactive_hours ?? 0)
    const rcaHours = Number(row.rca_hours ?? 0)
    const pmPercent = hrHours > 0 ? (pmHours / hrHours) * 100 : 0
    const reactivePercent = hrHours > 0 ? (reactiveHours / hrHours) * 100 : 0
    const totalPercent = pmPercent + reactivePercent
    return {
      idwkctr: String(row.idwkctr),
      wkctr,
      label: wkctr,
      displayName: row.display_name ? String(row.display_name) : null,
      hasImage: Boolean(row.has_image),
      pmPercent,
      reactivePercent,
      totalPercent,
      pmHours,
      reactiveHours,
      rcaHours,
      hrHours,
    }
  })

  const avg =
    rows.length > 0 ? rows.reduce((s, rr) => s + rr.totalPercent, 0) / rows.length : 0

  return { source: 'db', range, averagePercent: avg, rows }
}

