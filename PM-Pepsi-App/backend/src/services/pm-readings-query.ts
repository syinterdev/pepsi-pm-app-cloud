import type { Pool } from 'pg'
import * as XLSX from 'xlsx'
import {
  type BoardPeriodId,
  resolveBoardPeriodDateRange,
} from '../lib/board-period.js'
import { pmMeasurementMeta } from '../lib/pm-measurement-kind.js'
import type { BoardPmReadingGroup, BoardPmReadingsResponse } from '../schemas/board-pm-readings.js'
import { getAppTimezone } from './board-activity.js'

export type PmReadingExportRow = {
  wkorder: string
  team: string
  mntplan: string
  machine: string
  pmlist: string
  kind: string
  kindLabel: string
  measuredAt: string
  v1: number
  v2: number
  v3: number
  unit: string
  warningLimit: number | null
  alarmLimit: number | null
  wkctr: string
  pmNote: string
}

type DbRow = {
  wkorder: string | null
  team: string | null
  mntplan: string | null
  machine: string
  pmlist: string
  kind: string
  measured_at: Date
  v1: string
  v2: string
  v3: string
  unit: string
  warning_limit: string | null
  alarm_limit: string | null
  wkctr: string
  pm_note: string | null
}

function kindLabel(kind: string): string {
  if (kind === 'vibration_dst_db') return 'Vibration Dst/dB'
  if (kind === 'current_3phase') return 'กระแส 3 เฟส'
  return kind
}

function axisLabelsForKind(kind: string): [string, string, string] {
  const meta = pmMeasurementMeta(
    kind === 'vibration_dst_db'
      ? 'vibration_dst_db'
      : kind === 'current_3phase'
        ? 'current_3phase'
        : 'none',
  )
  return meta?.labels ?? ['ค่า 1', 'ค่า 2', 'ค่า 3']
}

function formatMeasuredAtTh(d: Date): string {
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function chartLabelFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function queryPmReadingDbRows(
  pool: Pool,
  opts: { from: string; to: string; team?: string; idiw37?: number; maxRows?: number },
): Promise<DbRow[]> {
  const timezone = await getAppTimezone(pool)
  const maxRows = Math.min(10_000, Math.max(1, opts.maxRows ?? 5000))
  const team = opts.team?.trim() || null

  const params: (string | number | null)[] = [timezone, opts.from, opts.to, team]
  let idiw37Clause = ''
  if (opts.idiw37 != null) {
    params.push(opts.idiw37)
    idiw37Clause = ` AND r.idiw37 = $${params.length}`
  }
  params.push(maxRows)

  const r = await pool.query<DbRow>(
    `SELECT i.wkorder, i.team, i.mntplan, r.machine, r.pmlist, r.kind, r.measured_at,
            r.v1, r.v2, r.v3, r.unit, r.warning_limit, r.alarm_limit, r.wkctr,
            n.note AS pm_note
     FROM app.tbwo_pm_reading r
     INNER JOIN app.tbiw37n i ON i.idiw37 = r.idiw37
     LEFT JOIN LATERAL (
       SELECT string_agg(e.note, E'\\n---\\n' ORDER BY e.created_at ASC, e.identry ASC) AS note
       FROM app.tbwo_pm_note_entry e
       WHERE e.idiw37 = r.idiw37
     ) n ON true
     WHERE timezone($1, r.measured_at)::date >= $2::date
       AND timezone($1, r.measured_at)::date <= $3::date
       AND ($4::text IS NULL OR i.team = $4::text)
       ${idiw37Clause}
     ORDER BY r.measured_at ASC, r.idreading ASC
     LIMIT $${params.length}`,
    params,
  )
  return r.rows
}

export async function listPmReadingExportRowsForWo(
  pool: Pool,
  idiw37: number,
): Promise<PmReadingExportRow[]> {
  const r = await pool.query<DbRow>(
    `SELECT i.wkorder, i.team, i.mntplan, r.machine, r.pmlist, r.kind, r.measured_at,
            r.v1, r.v2, r.v3, r.unit, r.warning_limit, r.alarm_limit, r.wkctr,
            n.note AS pm_note
     FROM app.tbwo_pm_reading r
     INNER JOIN app.tbiw37n i ON i.idiw37 = r.idiw37
     LEFT JOIN LATERAL (
       SELECT string_agg(e.note, E'\\n---\\n' ORDER BY e.created_at ASC, e.identry ASC) AS note
       FROM app.tbwo_pm_note_entry e
       WHERE e.idiw37 = r.idiw37
     ) n ON true
     WHERE r.idiw37 = $1
     ORDER BY r.measured_at ASC, r.idreading ASC
     LIMIT 2000`,
    [idiw37],
  )
  return r.rows.map((row) => mapDbRowToExport(row))
}

function mapDbRowToExport(row: DbRow): PmReadingExportRow {
  return {
    wkorder: row.wkorder?.trim() ?? '',
    team: row.team?.trim() ?? '',
    mntplan: row.mntplan?.trim() ?? '',
    machine: row.machine?.trim() ?? '',
    pmlist: row.pmlist?.trim() ?? '',
    kind: row.kind,
    kindLabel: kindLabel(row.kind),
    measuredAt: formatMeasuredAtTh(row.measured_at),
    v1: Number(row.v1),
    v2: Number(row.v2),
    v3: Number(row.v3),
    unit: row.unit?.trim() ?? '',
    warningLimit: row.warning_limit != null ? Number(row.warning_limit) : null,
    alarmLimit: row.alarm_limit != null ? Number(row.alarm_limit) : null,
    wkctr: row.wkctr?.trim() ?? '',
    pmNote: row.pm_note?.trim() ?? '',
  }
}

export async function listPmReadingExportRows(
  pool: Pool,
  opts: { from: string; to: string; team?: string; idiw37?: number; maxRows?: number },
): Promise<PmReadingExportRow[]> {
  const rows = await queryPmReadingDbRows(pool, opts)
  return rows.map((row) => mapDbRowToExport(row))
}

export function buildPmReadingsXlsxBuffer(rows: PmReadingExportRow[]): Buffer {
  const header = [
    'เลข WO',
    'ทีม',
    'แผน PM',
    'เครื่องจักร',
    'รายการ PM',
    'ประเภทการวัด',
    'วันเวลาวัด',
    'ค่า 1',
    'ค่า 2',
    'ค่า 3',
    'หน่วย',
    'Warning',
    'Alarm',
    'บันทึกโดย',
    'หมายเหตุ PM (WO)',
  ]
  const data = [
    header,
    ...rows.map((row) => [
      row.wkorder,
      row.team,
      row.mntplan,
      row.machine,
      row.pmlist,
      row.kindLabel,
      row.measuredAt,
      row.v1,
      row.v2,
      row.v3,
      row.unit,
      row.warningLimit ?? '',
      row.alarmLimit ?? '',
      row.wkctr,
      row.pmNote,
    ]),
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = header.map((h) => ({ wch: Math.max(12, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, ws, 'PM Readings')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}

export function groupPmReadingsForBoard(
  rows: DbRow[],
  groupLimit: number,
): BoardPmReadingGroup[] {
  const groupMap = new Map<string, BoardPmReadingGroup>()

  for (const row of rows) {
    const key = `${row.wkorder ?? ''}|${row.machine}|${row.pmlist}|${row.kind}`
    const kind = row.kind as 'current_3phase' | 'vibration_dst_db'
    const v1 = Number(row.v1)
    const v2 = Number(row.v2)
    const v3 = Number(row.v3)
    const at = row.measured_at

    let g = groupMap.get(key)
    if (!g) {
      g = {
        wkorder: row.wkorder?.trim() ?? '',
        machine: row.machine?.trim() ?? '',
        pmlist: row.pmlist?.trim() ?? '',
        kind,
        kindLabel: kindLabel(row.kind),
        unit: row.unit?.trim() ?? '',
        axisLabels: axisLabelsForKind(row.kind),
        latestAt: at.toISOString(),
        latestV1: v1,
        latestV2: v2,
        latestV3: v3,
        points: [],
      }
      groupMap.set(key, g)
    }

    g.points.push({ label: chartLabelFromDate(at), v1, v2, v3 })
    if (at.getTime() >= new Date(g.latestAt).getTime()) {
      g.latestAt = at.toISOString()
      g.latestV1 = v1
      g.latestV2 = v2
      g.latestV3 = v3
    }
  }

  return Array.from(groupMap.values())
    .map((g) => ({ ...g, points: g.points.slice(-10) }))
    .sort((a, b) => b.latestAt.localeCompare(a.latestAt))
    .slice(0, groupLimit)
}

export async function getBoardPmReadings(
  pool: Pool,
  opts: { period: BoardPeriodId; team?: 'A' | 'B' | 'EE' | 'UT'; limit: number },
): Promise<BoardPmReadingsResponse> {
  const timezone = await getAppTimezone(pool)
  const range = resolveBoardPeriodDateRange(opts.period, timezone)
  const dbRows = await queryPmReadingDbRows(pool, {
    from: range.from,
    to: range.to,
    team: opts.team,
    maxRows: 500,
  })

  const groupLimit = Math.min(12, Math.max(1, opts.limit))
  const groups = groupPmReadingsForBoard(dbRows, groupLimit)

  return {
    period: opts.period,
    range,
    summary: {
      totalReadings: dbRows.length,
      groupCount: new Set(
        dbRows.map((r) => `${r.wkorder}|${r.machine}|${r.pmlist}|${r.kind}`),
      ).size,
    },
    groups,
  }
}
