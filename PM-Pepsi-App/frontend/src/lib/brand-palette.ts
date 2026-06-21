/** พาเลตโลโก้ใหม่ลูกค้า — น้ำเงินเข้ม · ส้ม · เขียวเข้ม · เขียวอ่อน · ฟ้า · ขาว */
export const BRAND_LOGO = {
  blueDark: '#003366',
  orange: '#F7941D',
  greenDark: '#1E6B34',
  greenLight: '#7AC943',
  sky: '#4DA6FF',
  white: '#FFFFFF',
} as const

/** สีปฏิทิน / legend / สถานะงาน — อิงพาเลตโลโก้ */
export const BRAND_CALENDAR = {
  inProgress: BRAND_LOGO.sky,
  moved: BRAND_LOGO.orange,
  completed: BRAND_LOGO.greenLight,
  overdue: '#FF3B30',
  upcoming: BRAND_LOGO.sky,
  inProgressFilter: BRAND_LOGO.orange,
} as const

/** สีอ่อนสำหรับ legend วันหยุด (swatch ทึบ) */
export const BRAND_LEGEND_TINT = {
  sunday: '#fde8d0',
  saturday: '#d6ebff',
} as const

/** ค่าเริ่มต้น Admin Branding API + apply-theme */
export const BRAND_DEFAULTS = {
  primaryColor: BRAND_LOGO.blueDark,
  accentColor: BRAND_LOGO.orange,
  successColor: BRAND_LOGO.greenLight,
  warningColor: BRAND_LOGO.orange,
  /** สี semantic สำหรับลบ/ข้อผิดพลาด — ไม่อยู่ในโลโก้ แต่จำเป็นต่อ UX */
  dangerColor: '#FF3B30',
  infoColor: BRAND_LOGO.sky,
} as const

export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return '0, 51, 102'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return '0, 51, 102'
  return `${r}, ${g}, ${b}`
}

/** เขียน CSS variables พาเลตโลโก้ + alias เก่า (--brand-pepsi-*) */
export function applyBrandLogoTokens(
  root: HTMLElement,
  opts?: {
    primaryColor?: string
    accentColor?: string
    successColor?: string
    warningColor?: string
    infoColor?: string
  },
): void {
  const blueDark = opts?.primaryColor?.trim() || BRAND_LOGO.blueDark
  const orange = opts?.accentColor?.trim() || BRAND_LOGO.orange
  const greenLight = opts?.successColor?.trim() || BRAND_LOGO.greenLight
  const sky = opts?.infoColor?.trim() || BRAND_LOGO.sky

  root.style.setProperty('--brand-logo-blue-dark', blueDark)
  root.style.setProperty('--brand-logo-orange', orange)
  root.style.setProperty('--brand-logo-green-dark', BRAND_LOGO.greenDark)
  root.style.setProperty('--brand-logo-green-light', greenLight)
  root.style.setProperty('--brand-logo-sky', sky)
  root.style.setProperty('--brand-logo-white', BRAND_LOGO.white)

  root.style.setProperty('--brand-pepsi-blue', blueDark)
  root.style.setProperty('--brand-pepsi-red', orange)
  root.style.setProperty('--brand-pepsi-white', BRAND_LOGO.white)
  root.style.setProperty('--brand-pepsi-orange', orange)
  root.style.setProperty('--brand-pepsi-green', greenLight)
}
