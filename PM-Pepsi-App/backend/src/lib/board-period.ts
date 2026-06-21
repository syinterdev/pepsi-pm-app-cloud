/** Board period (B0) — mirror frontend `board-period.ts` using IANA timezone */

export const BOARD_PERIOD_IDS = ['today', '7d', 'week'] as const
export type BoardPeriodId = (typeof BOARD_PERIOD_IDS)[number]

export function isBoardPeriodId(v: string): v is BoardPeriodId {
  return (BOARD_PERIOD_IDS as readonly string[]).includes(v)
}

type ZonedParts = {
  year: number
  month: number
  day: number
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatIsoDate(parts: ZonedParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

function addDays(parts: ZonedParts, delta: number): ZonedParts {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + delta))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/** Monday-start week in calendar of `ref` (timezone). */
function weekdayMon0(parts: ZonedParts, timeZone: string): number {
  const anchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0))
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(anchor)
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
  const i = order.indexOf(short as (typeof order)[number])
  return i >= 0 ? i : 0
}

function startOfWeekMon(parts: ZonedParts, timeZone: string): ZonedParts {
  return addDays(parts, -weekdayMon0(parts, timeZone))
}

function endOfWeekSun(start: ZonedParts): ZonedParts {
  return addDays(start, 6)
}

export function resolveBoardPeriodDateRange(
  periodId: BoardPeriodId,
  timeZone: string,
  refDate: Date = new Date(),
): { from: string; to: string } {
  const today = zonedParts(refDate, timeZone)
  switch (periodId) {
    case 'today':
      return { from: formatIsoDate(today), to: formatIsoDate(today) }
    case '7d': {
      const from = addDays(today, -6)
      return { from: formatIsoDate(from), to: formatIsoDate(today) }
    }
    case 'week': {
      const from = startOfWeekMon(today, timeZone)
      const to = endOfWeekSun(from)
      return { from: formatIsoDate(from), to: formatIsoDate(to) }
    }
  }
}
