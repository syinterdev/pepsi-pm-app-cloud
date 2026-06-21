import type { Pool } from 'pg'
import { resolveWoPmPhase } from '../lib/wo-pm-phase.js'
import type { calendarEventSchema } from '../schemas/calendar.js'
import type { z } from 'zod'

export type CalendarEvent = z.infer<typeof calendarEventSchema>

/** Factory code 7151 scope */
export const FACTORY_CODE = '7151'

/** เงื่อนไขโรงงาน — PHP ใช้ functionalloc; รองรับ ALV ที่มี 7151 ใน funcdescrip หรือ prefix ตอน import */
export function sqlFactoryScope(columnPrefix = '', paramRef: string): string {
  const c = columnPrefix ? `${columnPrefix}.` : ''
  return `(${c}functionalloc ILIKE ${paramRef} OR ${c}funcdescrip ILIKE ${paramRef})`
}

/** แผนเขียว (TECO/ปิดแล้ว) ห้าม Move — Details Rev.1 + LEGACY A.1 */
const PLAN_MOVABLE_SYST = new Set(['CRTD', 'REL'])

export function isPlanMovableStatus(syst: string | null | undefined): boolean {
  const s = (syst ?? '').trim().toUpperCase()
  return PLAN_MOVABLE_SYST.has(s)
}

export type OrderRow = {
  idiw37: number
  wkorder: string
  wktype: string | null
  wkctr: string | null
  bscstart: string | number | null
  actfinish: string | number | null
  cday: string | number | null
  syst: string | null
  operationshorttext: string | null
  wkstcolor: string | null
}

export function unixToDateString(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function pickDisplayUnix(row: OrderRow): number | null {
  const cday = row.cday != null && row.cday !== '' ? Number(row.cday) : null
  if (cday != null && cday > 0) return cday
  const actfinish =
    row.actfinish != null && row.actfinish !== '' ? Number(row.actfinish) : null
  if (actfinish != null && actfinish > 0) return actfinish
  const bscstart =
    row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
  if (bscstart != null && bscstart > 0) return bscstart
  return null
}

export function mapOrderRowToEvent(
  row: OrderRow,
  moveColor: string,
  workflowSuffix?: string,
): CalendarEvent | null {
  const bscstart =
    row.bscstart != null && row.bscstart !== '' ? Number(row.bscstart) : null
  if (bscstart == null || !Number.isFinite(bscstart) || bscstart <= 0) {
    return null
  }

  const displayUnix = pickDisplayUnix(row)
  if (displayUnix == null) return null

  const syst = (row.syst ?? '').trim()
  const hasMove =
    row.cday != null &&
    row.cday !== '' &&
    Number(row.cday) > 0 &&
    (syst === 'REL' || syst === 'CRTD')
  const color = hasMove ? moveColor : (row.wkstcolor ?? '#6b7280')

  const wktype = row.wktype?.trim() ?? ''
  let title = wktype ? `${row.wkorder} / ${wktype}` : row.wkorder
  const suffix = workflowSuffix?.trim()
  if (suffix) title = `${title}/${suffix}`

  return {
    id: String(row.idiw37),
    date: unixToDateString(displayUnix),
    title,
    orderId: row.wkorder,
    color,
    description: row.operationshorttext?.trim() || undefined,
    canMovePlan: isPlanMovableStatus(syst),
    syst,
    pmPhase: resolveWoPmPhase(syst),
    wkctr: row.wkctr?.trim() || undefined,
  }
}

export async function getMoveOverColor(pool: Pool): Promise<string> {
  const r = await pool.query<{ wkstcolor: string }>(
    `SELECT wkstcolor FROM app.tbwkstatus WHERE syst = 'MOVE OVER' LIMIT 1`,
  )
  return r.rows[0]?.wkstcolor ?? '#F7941D'
}

export function monthRangeSec(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return {
    startSec: Math.floor(start.getTime() / 1000),
    endSec: Math.floor(end.getTime() / 1000),
    prefix: `${year}-${String(month).padStart(2, '0')}`,
  }
}

export function appendInFilter(
  column: string,
  values: string[] | undefined,
  params: unknown[],
): string {
  const list = values ?? []
  if (list.length === 0) return ''
  const start = params.length + 1
  const placeholders = list.map((_, i) => `$${start + i}`).join(', ')
  params.push(...list)
  return ` AND ${column} IN (${placeholders})`
}
