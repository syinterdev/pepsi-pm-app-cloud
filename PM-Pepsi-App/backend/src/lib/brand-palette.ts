/** พาเลตโลโก้ใหม่ — sync กับ frontend `lib/brand-palette.ts` */
export const BRAND_LOGO = {
  blueDark: '#003366',
  orange: '#F7941D',
  greenDark: '#1E6B34',
  greenLight: '#7AC943',
  sky: '#4DA6FF',
  white: '#FFFFFF',
} as const

/** สีปฏิทิน / สถานะงาน — อิงพาเลตโลโก้ */
export const BRAND_CALENDAR = {
  inProgress: BRAND_LOGO.sky,
  moved: BRAND_LOGO.orange,
  completed: BRAND_LOGO.greenLight,
  overdue: '#FF3B30',
  upcoming: BRAND_LOGO.sky,
  inProgressFilter: BRAND_LOGO.orange,
} as const
