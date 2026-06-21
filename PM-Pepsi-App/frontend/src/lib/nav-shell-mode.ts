import { navShellModeSchema, type NavShellMode } from '@/api/schemas'

export { navShellModeSchema, type NavShellMode }

export const DEFAULT_NAV_SHELL_MODE: NavShellMode = 'sidebar'

export const NAV_SHELL_MODE_LABELS: Record<NavShellMode, string> = {
  sidebar: 'Sidebar ซ้าย (ค่าเริ่มต้น) — มีปักหมุด',
  navbar: 'แถบเมนูบน (Navbar) — ไม่มี sidebar/ปักหมุด',
  hamburger: 'มือถือ: drawer · เดสก์ท็อป: sidebar ย่อ + ปักหมุด',
}
