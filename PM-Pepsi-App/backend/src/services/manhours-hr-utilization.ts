import type { Pool } from 'pg'
import { safeRatio } from '../lib/reports-range.js'
import {
  resolveManhourChartRange,
  type ManhourChartRange,
} from './manhour-chart.js'

export type ManhourHrUtilPerson = {
  idwkctr: string
  wkctr: string
  displayName: string | null
  confirmHours: number
  manhourHours: number
  utilizationPercent: number
}

export type ManhourHrUtilization = {
  range: ManhourChartRange
  team: {
    confirmHours: number
    manhourHours: number
    utilizationPercent: number
  }
  byPerson: ManhourHrUtilPerson[]
  manhourWorkdayFrom: string | null
  manhourWorkdayTo: string | null
}

function unixToIsoDate(sec: number | null): string | null {
  if (sec == null || !Number.isFinite(sec)) return null
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MH_HOURS_SQL = `COALESCE(SUM(m.wh + m.ot1 + m.ot15 + m.ot1hol + m.ot2 + m.ot3), 0)`

/**
 * % Utilization = Confirm ชม. ÷ HR ชม. (Summary/W)
 * ใช้ร่วมกับ KPI `/reports` (Confirm/HR รายสัปดาห์)
 */
export async function getManhoursHrUtilization(
  pool: Pool,
  filterWkctr: string,
  opts: { fromInput?: string; toInput?: string } = {},
): Promise<ManhourHrUtilization> {
  const range = resolveManhourChartRange(opts.fromInput, opts.toInput)
  const { from, to } = range

  const [peopleRes, boundsRes] = await Promise.all([
    pool.query<{
      idwkctr: string
      wkctr: string
      display_name: string | null
      mh_hours: string
      confirm_hours: string
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
           )), '') AS display_name
         FROM app.tbworkcenter wc
         WHERE wc.wkctr = $1
       ),
       mh AS (
         SELECT m.idwkctr, ${MH_HOURS_SQL}::text AS hours
         FROM app.tbmanhours m
         INNER JOIN people p ON p.idwkctr = m.idwkctr
         WHERE m.workday >= $2 AND m.workday <= $3
         GROUP BY m.idwkctr
       ),
       conf AS (
         SELECT p.wkctr, COALESCE(SUM(c.timewk), 0)::text AS hours
         FROM app.view_exportconfirm c
         INNER JOIN people p ON p.wkctr = c.wkctr
         WHERE c.endate >= $2 AND c.endate <= $3
         GROUP BY p.wkctr
       )
       SELECT
         p.idwkctr,
         p.wkctr,
         p.display_name,
         COALESCE(mh.hours, '0') AS mh_hours,
         COALESCE(conf.hours, '0') AS confirm_hours
       FROM people p
       LEFT JOIN mh ON mh.idwkctr = p.idwkctr
       LEFT JOIN conf ON conf.wkctr = p.wkctr`,
      [filterWkctr, from, to],
    ),
    pool.query<{ min_wd: number | null; max_wd: number | null }>(
      `SELECT MIN(m.workday) AS min_wd, MAX(m.workday) AS max_wd
       FROM app.tbmanhours m
       INNER JOIN app.tbworkcenter wc ON wc.idwkctr = m.idwkctr
       WHERE wc.wkctr = $1`,
      [filterWkctr],
    ),
  ])

  const byPerson: ManhourHrUtilPerson[] = peopleRes.rows.map((r) => {
    const manhourHours = Number(r.mh_hours)
    const confirmHours = Number(r.confirm_hours)
    return {
      idwkctr: r.idwkctr,
      wkctr: r.wkctr,
      displayName: r.display_name,
      confirmHours,
      manhourHours,
      utilizationPercent: safeRatio(confirmHours, manhourHours),
    }
  })

  byPerson.sort((a, b) => b.manhourHours - a.manhourHours)

  let teamConfirm = 0
  let teamMh = 0
  for (const p of byPerson) {
    teamConfirm += p.confirmHours
    teamMh += p.manhourHours
  }

  return {
    range,
    team: {
      confirmHours: Math.round(teamConfirm * 100) / 100,
      manhourHours: Math.round(teamMh * 100) / 100,
      utilizationPercent: safeRatio(teamConfirm, teamMh),
    },
    byPerson,
    manhourWorkdayFrom: unixToIsoDate(boundsRes.rows[0]?.min_wd ?? null),
    manhourWorkdayTo: unixToIsoDate(boundsRes.rows[0]?.max_wd ?? null),
  }
}
