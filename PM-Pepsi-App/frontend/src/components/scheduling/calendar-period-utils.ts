import { i18n } from '@/i18n'

export function buildYearOptions(min: number, max: number): number[] {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
}

/** Month names for period pickers — follows active UI locale */
export function getCalendarMonthNames(): string[] {
  const raw = i18n.t('calendar.monthsLong', { ns: 'common', returnObjects: true })
  if (Array.isArray(raw) && raw.length === 12) return raw.map(String)
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
}

