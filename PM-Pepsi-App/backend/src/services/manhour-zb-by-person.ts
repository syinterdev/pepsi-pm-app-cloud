import type { Pool } from 'pg'
import { resolveManhourChartRange, type ManhourChartRange } from './manhour-chart.js'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'

export type ManhourZbPersonRow = {
  wkctr: string
  displayName: string | null
  zb01Planned: number
  zb01Confirmed: number
  zb02Planned: number
  zb02Confirmed: number
  zb05Planned: number
  zb05Confirmed: number
}

export type ManhourZbByPersonResponse = {
  range: ManhourChartRange
  rows: ManhourZbPersonRow[]
}

const ZB_TYPES = ['ZB01', 'ZB02', 'ZB05'] as const

type ZbType = (typeof ZB_TYPES)[number]

function emptyRow(wkctr: string, displayName: string | null): ManhourZbPersonRow {
  return {
    wkctr,
    displayName,
    zb01Planned: 0,
    zb01Confirmed: 0,
    zb02Planned: 0,
    zb02Confirmed: 0,
    zb05Planned: 0,
    zb05Confirmed: 0,
  }
}

function applyStat(
  row: ManhourZbPersonRow,
  wktype: ZbType,
  planned: number,
  confirmed: number,
) {
  if (wktype === 'ZB01') {
    row.zb01Planned = planned
    row.zb01Confirmed = confirmed
  } else if (wktype === 'ZB02') {
    row.zb02Planned = planned
    row.zb02Confirmed = confirmed
  } else {
    row.zb05Planned = planned
    row.zb05Confirmed = confirmed
  }
}

export async function getManhourZbByPerson(
  pool: Pool,
  opts: { fromInput?: string; toInput?: string; filterWkctr?: string } = {},
): Promise<ManhourZbByPersonResponse> {
  const range = resolveManhourChartRange(opts.fromInput, opts.toInput)
  const { from, to } = range
  const activeWc = personnelIsActiveSql('wc')
  const filterWkctr = opts.filterWkctr?.trim()
  const params: unknown[] = [ZB_TYPES, from, to]
  const wkctrCond = filterWkctr
    ? (() => {
        params.push(filterWkctr)
        return `AND wc.wkctr = $${params.length}`
      })()
    : ''

  const r = await pool.query<{
    wkctr: string
    display_name: string | null
    wktype: ZbType
    planned_n: string
    confirmed_n: string
  }>(
    `WITH people AS (
       SELECT
         wc.wkctr,
         NULLIF(TRIM(CONCAT(
           COALESCE(wc.titlewkctr,''),
           COALESCE(wc.namewkctr,''),
           ' ',
           COALESCE(wc.surnamewkctr,'')
         )), '') AS display_name
       FROM app.tbworkcenter wc
       WHERE wc.wkctr IS NOT NULL AND TRIM(wc.wkctr) <> ''
         AND ${activeWc}
         ${wkctrCond}
     ),
     planned AS (
       SELECT wkctr, wktype, COUNT(*)::text AS n
       FROM app.view_planwork
       WHERE wktype = ANY($1) AND bscstart BETWEEN $2 AND $3
       GROUP BY wkctr, wktype
     ),
     confirmed AS (
       SELECT wkctr, wktype, COUNT(*)::text AS n
       FROM app.view_exportconfirm
       WHERE wktype = ANY($1) AND endate BETWEEN $2 AND $3
       GROUP BY wkctr, wktype
     ),
     stats AS (
       SELECT
         p.wkctr,
         p.display_name,
         t.wktype,
         COALESCE(pl.n, '0') AS planned_n,
         COALESCE(cf.n, '0') AS confirmed_n
       FROM people p
       CROSS JOIN (SELECT unnest($1::text[]) AS wktype) t
       LEFT JOIN planned pl ON pl.wkctr = p.wkctr AND pl.wktype = t.wktype
       LEFT JOIN confirmed cf ON cf.wkctr = p.wkctr AND cf.wktype = t.wktype
     )
     SELECT *
     FROM stats
     WHERE planned_n::int > 0 OR confirmed_n::int > 0
     ORDER BY wkctr ASC, wktype ASC`,
    params,
  )

  const map = new Map<string, ManhourZbPersonRow>()
  for (const it of r.rows) {
    const base = map.get(it.wkctr) ?? emptyRow(it.wkctr, it.display_name)
    applyStat(base, it.wktype, Number(it.planned_n), Number(it.confirmed_n))
    map.set(it.wkctr, base)
  }

  const rows = Array.from(map.values())
  rows.sort(
    (a, b) =>
      b.zb01Planned +
      b.zb02Planned +
      b.zb05Planned -
      (a.zb01Planned + a.zb02Planned + a.zb05Planned),
  )

  return { range, rows }
}

