/** ค่าเริ่มต้น UI ปฏิทิน modern — ปรับที่นี่หรือส่ง prop ใน MonthFullCalendar */
export const MODERN_CALENDAR_DEFAULTS = {
  /** จำนวนงานที่แสดงเต็มในช่องวันก่อนแสดง "+N งาน" */
  dayMaxEvents: 5,
  /** ความสูงขั้นต่ำของช่องวัน (month view) */
  dayCellMinHeight: '7.5rem',
} as const

export type ModernCalendarThemeVars = {
  dayCellMinHeight?: string
  weekendBg?: string
  weekendBorder?: string
  sundayBg?: string
  saturdayBg?: string
  weekendHeaderColor?: string
}

/** CSS custom properties สำหรับ .pm-fullcalendar--modern */
export function modernCalendarThemeStyle(
  vars?: ModernCalendarThemeVars,
): Record<string, string> {
  return {
    '--pm-cal-day-min-height':
      vars?.dayCellMinHeight ?? MODERN_CALENDAR_DEFAULTS.dayCellMinHeight,
    '--pm-cal-weekend-bg':
      vars?.weekendBg ??
      'color-mix(in srgb, var(--brand-logo-orange) 6%, var(--app-surface))',
    '--pm-cal-weekend-border':
      vars?.weekendBorder ??
      'color-mix(in srgb, var(--brand-logo-orange) 18%, var(--app-border))',
    '--pm-cal-sunday-bg':
      vars?.sundayBg ??
      'color-mix(in srgb, var(--brand-logo-orange) 9%, var(--app-surface))',
    '--pm-cal-saturday-bg':
      vars?.saturdayBg ??
      'color-mix(in srgb, var(--brand-logo-sky) 7%, var(--app-surface))',
    '--pm-cal-weekend-header':
      vars?.weekendHeaderColor ??
      'color-mix(in srgb, var(--brand-logo-orange) 70%, var(--app-text-muted))',
  }
}
