import { BRAND_CALENDAR } from './brand-palette.js'
import { isPlanMovableStatus } from '../services/scheduling-shared.js'
import { isCalendarDisplayDateOverdue } from './calendar-move-policy.js'

/** ค่าตัวกรองสถานะบนปฏิทิน — เทียบสไลด์ลูกค้าข้อ 5 */
export const CALENDAR_DISPLAY_STATUS_CODES = [
  'overdue',
  'completed',
  'in_progress',
  'upcoming',
] as const

export type CalendarDisplayStatusCode = (typeof CALENDAR_DISPLAY_STATUS_CODES)[number]

export const CALENDAR_DISPLAY_STATUS_OPTIONS: {
  code: CalendarDisplayStatusCode
  label: string
  color: string
}[] = [
  { code: 'overdue', label: 'Overdue — เลยกำหนด', color: BRAND_CALENDAR.overdue },
  { code: 'completed', label: 'Completed — เสร็จแล้ว', color: BRAND_CALENDAR.completed },
  {
    code: 'in_progress',
    label: 'In Progress — กำลังทำ',
    color: BRAND_CALENDAR.inProgressFilter,
  },
  { code: 'upcoming', label: 'UpComing — ยังไม่ถึงวัน', color: BRAND_CALENDAR.upcoming },
]

/** unix เริ่มวันนี้ 00:00 local */
export function calendarTodayStartSec(now: Date = new Date()): number {
  return Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000,
  )
}

/** แสดงวันบนปฏิทิน — same as calendar display date */
export function sqlCalendarDisplayUnix(alias: string): string {
  const c = alias ? `${alias}.` : ''
  return `COALESCE(NULLIF(${c}cday, 0), NULLIF(${c}actfinish, 0), ${c}bscstart)`
}

function sqlHasPlanMove(alias: string): string {
  const c = alias ? `${alias}.` : ''
  return `(
    ${c}cday IS NOT NULL AND ${c}cday > 0
    AND COALESCE(${c}mpcount, 0) >= 1
    AND ${c}syst IN ('CRTD', 'REL')
  )`
}

function sqlIsCompleted(alias: string, viewAlias: string): string {
  const c = alias ? `${alias}.` : ''
  const v = viewAlias ? `${viewAlias}.` : ''
  return `(
    ${c}syst IS NOT NULL AND ${c}syst NOT IN ('CRTD', 'REL')
    OR COALESCE(${v}percent_close, 0) >= 100
    OR LOWER(TRIM(COALESCE(ti.confirm_qc_status, ''))) = 'approved'
  )`
}

/** เงื่อนไข SQL ต่อสถานะเดียว */
export function sqlCalendarDisplayStatusMatch(
  code: CalendarDisplayStatusCode,
  alias: string,
  viewAlias: string,
  todayStart: number,
): string {
  const display = sqlCalendarDisplayUnix(alias)
  const open = `${alias}.syst IN ('CRTD', 'REL')`
  const completed = sqlIsCompleted(alias, viewAlias)
  const tomorrowStart = todayStart + 86400

  switch (code) {
    case 'completed':
      return completed
    case 'upcoming':
      return `(${open} AND NOT (${completed}) AND ${display} >= ${tomorrowStart})`
    case 'overdue':
      return `(${open} AND NOT (${completed}) AND ${display} > 0 AND ${display} < ${todayStart})`
    case 'in_progress':
      return `(
        ${open}
        AND NOT (${completed})
        AND ${display} >= ${todayStart}
        AND ${display} < ${tomorrowStart}
      )`
    default:
      return 'FALSE'
  }
}

export function appendCalendarDisplayStatusFilter(
  values: string[] | undefined,
  alias: string,
  viewAlias: string,
  params: unknown[],
): string {
  const codes = (values ?? []).filter((v): v is CalendarDisplayStatusCode =>
    (CALENDAR_DISPLAY_STATUS_CODES as readonly string[]).includes(v),
  )
  if (codes.length === 0) return ''

  const todayStart = calendarTodayStartSec()
  const parts = codes.map((code) => sqlCalendarDisplayStatusMatch(code, alias, viewAlias, todayStart))
  return ` AND (${parts.join(' OR ')})`
}

/** ใช้ใน unit test — mirror logic ฝั่ง TS */
export function matchesCalendarDisplayStatus(
  code: CalendarDisplayStatusCode,
  input: {
    syst?: string | null
    displayUnix: number
    cday?: number | null
    mpcount?: number | null
    percentClose?: number
    confirmQcStatus?: string | null
  },
  now?: Date,
): boolean {
  const todayStart = calendarTodayStartSec(now)
  const tomorrowStart = todayStart + 86400
  const syst = (input.syst ?? '').trim()
  const completed =
    (syst !== 'CRTD' && syst !== 'REL' && syst !== '') ||
    Number(input.percentClose ?? 0) >= 100 ||
    (input.confirmQcStatus ?? '').trim().toLowerCase() === 'approved'

  if (code === 'completed') return completed
  if (!isPlanMovableStatus(syst) || completed) return false

  const display = input.displayUnix
  if (code === 'upcoming') return display >= tomorrowStart
  if (code === 'overdue') return isCalendarDisplayDateOverdue(display, now)
  if (code === 'in_progress') {
    return display >= todayStart && display < tomorrowStart
  }
  return false
}
