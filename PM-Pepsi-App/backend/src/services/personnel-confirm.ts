/**
 * Personnel Confirmation service
 *
 * อ่าน `app.view_countpersonelclose` กรอง syst IN (CRTD,REL) เรียงตาม countwkctr ASC
 * เพื่อให้รายการที่ยังปิดน้อยขึ้นก่อน + สรุปยอด open/in-progress/done
 *
 * รองรับ filter เพิ่มเติม:
 *   - q: ค้นหา wkorder / mntplan / equdescrip / shortText (ILIKE)
 *   - status: 'all' | 'not_started' | 'in_progress' | 'done'
 *   - syst: รายการ syst (default CRTD,REL)
 */
import type { Pool } from 'pg'
import type { PersonnelConfirmListResponse } from '../schemas/personnel-confirm.js'

type Row = {
  idiw37: number
  wkorder: string
  mntplan: string | null
  wktype: string | null
  mat: string | null
  equdescrip: string | null
  functionalloc: string | null
  operationshorttext: string | null
  bscstart: string | null
  cday: string | null
  systemstatus: string | null
  syst: string | null
  wkstcolor: string | null
  wkctr: string | null
  planned_count: number | string | null
  countwkctr: number | string | null
  percent_close: number | string | null
  has_confirm: number | string | null
  confirm_qc_status: string | null
}

export type PersonnelConfirmFilter = {
  q?: string
  status?: 'all' | 'not_started' | 'in_progress' | 'done' | 'qc_pending'
  syst?: string[]
  limit?: number
  offset?: number
}

function unixToIsoDate(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  const d = new Date(n * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function listPersonnelConfirm(
  pool: Pool,
  filter: PersonnelConfirmFilter,
): Promise<PersonnelConfirmListResponse> {
  const params: unknown[] = []
  const where: string[] = []

  const syst = filter.syst && filter.syst.length > 0 ? filter.syst : ['CRTD', 'REL']
  params.push(syst)
  where.push(`v.syst = ANY($${params.length}::text[])`)

  if (filter.q && filter.q.trim()) {
    params.push(`%${filter.q.trim()}%`)
    const i = params.length
    where.push(
      `(v.wkorder ILIKE $${i} OR COALESCE(v.mntplan,'') ILIKE $${i} OR COALESCE(v.equdescrip,'') ILIKE $${i} OR COALESCE(v.operationshorttext,'') ILIKE $${i})`,
    )
  }

  switch (filter.status) {
    case 'not_started':
      where.push(`COALESCE(v.countwkctr,0) = 0`)
      break
    case 'in_progress':
      where.push(`COALESCE(v.countwkctr,0) > 0 AND COALESCE(v.percent_close,0) < 100`)
      break
    case 'done':
      where.push(`COALESCE(v.percent_close,0) >= 100`)
      break
    case 'qc_pending':
      where.push(`v.confirm_qc_status = 'pending'`)
      break
    default:
      break
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const limit = Math.max(1, Math.min(filter.limit ?? 200, 1000))
  const offset = Math.max(0, filter.offset ?? 0)

  const sql = `
    SELECT
      v.idiw37, v.wkorder, v.mntplan, v.wktype, v.mat,
      v.equdescrip, v.functionalloc, v.operationshorttext,
      v.bscstart::text  AS bscstart,
      v.cday::text      AS cday,
      v.systemstatus, v.syst, v.wkstcolor, v.wkctr,
      v.planned_count, v.countwkctr, v.percent_close, v.has_confirm, v.confirm_qc_status
    FROM app.view_countpersonelclose v
    ${whereSql}
    ORDER BY COALESCE(v.countwkctr,0) ASC, v.bscstart ASC NULLS LAST, v.idiw37 ASC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countSql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE COALESCE(v.percent_close,0) >= 100)::int AS fully_closed,
      COUNT(*) FILTER (
        WHERE COALESCE(v.countwkctr,0) > 0 AND COALESCE(v.percent_close,0) < 100
      )::int AS in_progress,
      COUNT(*) FILTER (WHERE COALESCE(v.countwkctr,0) = 0)::int AS not_started
    FROM app.view_countpersonelclose v
    ${whereSql}
  `

  const [rowsRes, sumRes] = await Promise.all([
    pool.query<Row>(sql, params),
    pool.query<{
      total: number
      fully_closed: number
      in_progress: number
      not_started: number
    }>(countSql, params),
  ])

  const items: PersonnelConfirmListResponse['items'] = rowsRes.rows.map((r) => ({
    idiw37: Number(r.idiw37),
    wkorder: r.wkorder,
    mntplan: r.mntplan?.trim() ?? null,
    wktype: r.wktype?.trim() ?? null,
    mat: r.mat?.trim() ?? null,
    equdescrip: r.equdescrip?.trim() ?? null,
    functionalloc: r.functionalloc?.trim() ?? null,
    shortText: r.operationshorttext?.trim() ?? null,
    bscStart: unixToIsoDate(r.bscstart),
    cday: unixToIsoDate(r.cday),
    syst: r.syst?.trim() ?? null,
    systemstatus: r.systemstatus?.trim() ?? null,
    wkstcolor: r.wkstcolor?.trim() ?? null,
    wkctr: r.wkctr?.trim() ?? null,
    plannedCount: Number(r.planned_count ?? 0),
    closedCount: Number(r.countwkctr ?? 0),
    percentClose: Number(r.percent_close ?? 0),
    hasConfirm: Number(r.has_confirm ?? 0) > 0,
    qcStatus:
      r.confirm_qc_status === 'pending' ||
      r.confirm_qc_status === 'approved' ||
      r.confirm_qc_status === 'rejected'
        ? r.confirm_qc_status
        : null,
  }))

  const sum = sumRes.rows[0] ?? {
    total: 0,
    fully_closed: 0,
    in_progress: 0,
    not_started: 0,
  }

  return {
    items,
    totalRows: Number(sum.total),
    summary: {
      totalOpen: Number(sum.total),
      fullyClosed: Number(sum.fully_closed),
      inProgress: Number(sum.in_progress),
      notStarted: Number(sum.not_started),
    },
  }
}
