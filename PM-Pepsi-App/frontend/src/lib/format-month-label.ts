import type { AppLocale } from '@/lib/app-locale'
import { i18n } from '@/i18n'
import { coerceStringArray } from '@/lib/coerce-array'

/** Month label on scheduling headers (B.E. year for Thai). */
export function formatCalendarMonthLabel(
  month: number,
  year: number,
  locale: AppLocale,
): string {
  if (month < 1 || month > 12) return String(year)
  if (locale === 'th') {
    const months = coerceStringArray(
      i18n.t('calendar.monthsShort', {
        ns: 'common',
        returnObjects: true,
      }),
    )
    return `${months[month - 1] ?? month} ${year + 543}`
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}
