import { BRAND_CALENDAR } from '@/lib/brand-palette'

/** สีตัวกรองสถานะปฏิทิน — สอดคล้อง backend CALENDAR_DISPLAY_STATUS_OPTIONS */
export const CALENDAR_DISPLAY_STATUS_COLORS: Record<string, string> = {
  overdue: BRAND_CALENDAR.overdue,
  completed: BRAND_CALENDAR.completed,
  in_progress: BRAND_CALENDAR.inProgressFilter,
  upcoming: BRAND_CALENDAR.upcoming,
}

export function withDisplayStatusColors(
  options: { code: string; label: string }[],
): { code: string; label: string; color?: string }[] {
  return options.map((o) => ({
    ...o,
    color: CALENDAR_DISPLAY_STATUS_COLORS[o.code],
  }))
}
