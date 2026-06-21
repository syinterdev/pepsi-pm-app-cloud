import { endOfWeek, format, startOfDay, startOfWeek, subDays } from 'date-fns'

const STORAGE_KEY = 'pm_board_period'

/** ช่วงเวลา Board Phase 2 (B0) — สอดคล้อง `period=today|7d|week` ใน API อนาคต */
export type BoardPeriodId = 'today' | '7d' | 'week'

export type BoardPeriodOption = {
  id: BoardPeriodId
}

export const BOARD_PERIOD_OPTIONS: readonly BoardPeriodOption[] = [
  { id: 'today' },
  { id: '7d' },
  { id: 'week' },
] as const

export function isBoardPeriodId(v: string): v is BoardPeriodId {
  return v === 'today' || v === '7d' || v === 'week'
}

export function readBoardPeriod(): BoardPeriodId {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw && isBoardPeriodId(raw)) return raw
  } catch {
    /* ignore */
  }
  return '7d'
}

export function writeBoardPeriod(id: BoardPeriodId): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function resolveBoardPeriodDateRange(
  periodId: BoardPeriodId,
  refDate: Date = new Date(),
): { from: string; to: string } {
  const today = startOfDay(refDate)
  switch (periodId) {
    case 'today':
      return {
        from: format(today, 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd'),
      }
    case '7d':
      return {
        from: format(subDays(today, 6), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd'),
      }
    case 'week': {
      const from = startOfWeek(today, { weekStartsOn: 1 })
      const to = endOfWeek(today, { weekStartsOn: 1 })
      return {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
      }
    }
  }
}

export function formatBoardPeriodRangeLabel(
  periodId: BoardPeriodId,
  range: { from: string; to: string },
  periodLabel: string,
): string {
  if (periodId === 'today') return `${periodLabel} (${range.from})`
  if (range.from === range.to) return `${periodLabel} (${range.from})`
  return `${periodLabel} (${range.from} – ${range.to})`
}
