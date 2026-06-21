/**
 * Resolve role ของ user สำหรับ Personal Dashboard
 * - `userrole` ใน `tbworkcenter` คือ source of truth ใหม่ (migration 041)
 * - ถ้า data ยังไม่ migrate จะ fallback จาก legacy `userst` + position เหมือนเดิม
 *
 * `userst` ยังคงใช้กับ menuright legacy (`A:U:W`) ส่วน dashboard/RBAC ใหม่ควรใช้ `userrole`
 */
export type UserRole = 'admin' | 'manager' | 'planner' | 'technician'

const MANAGER_KEYWORDS = [
  'manager',
  'chief',
  'supervisor',
  'หัวหน้า',
  'ผู้จัดการ',
  'ผจก',
]

const PLANNER_KEYWORDS = [
  'planner',
  'planning',
  'engineer',
  'engineering',
  'วิศวกร',
  'วางแผน',
  'แพลนเนอร์',
]

const TECHNICIAN_KEYWORDS = ['technician', 'ช่าง', 'mechanic']

function containsAny(text: string, kws: readonly string[]): boolean {
  const t = text.toLowerCase()
  return kws.some((k) => t.includes(k.toLowerCase()))
}

export function normalizeUserRole(value: string | null | undefined): UserRole | null {
  const v = (value ?? '').trim().toLowerCase()
  if (v === 'admin' || v === 'manager' || v === 'planner' || v === 'technician') {
    return v
  }
  return null
}

export function deriveUserRole(
  userst: string | null | undefined,
  position?: string | null,
): UserRole {
  const u = (userst ?? '').trim().toUpperCase()
  const pos = (position ?? '').trim()

  if (u === 'A') return 'admin'
  if (u === 'W') return 'technician'
  if (u === 'H') return 'manager'

  // userst === 'U' หรือว่างเปล่า — ใช้ position เป็นตัวช่วยตัดสิน
  if (pos) {
    if (containsAny(pos, MANAGER_KEYWORDS)) return 'manager'
    if (containsAny(pos, TECHNICIAN_KEYWORDS)) return 'technician'
    if (containsAny(pos, PLANNER_KEYWORDS)) return 'planner'
  }

  // default: planner (ผู้ใช้งานทั่วไปส่วนใหญ่เป็น planner/engineering)
  return 'planner'
}

export function resolveUserRole(
  userrole: string | null | undefined,
  userst: string | null | undefined,
  position?: string | null,
): UserRole {
  return normalizeUserRole(userrole) ?? deriveUserRole(userst, position)
}

export const ROLE_LABEL_TH: Record<UserRole, string> = {
  admin: 'ผู้ดูแลระบบ (Admin)',
  manager: 'ผู้จัดการ / หัวหน้างาน (Manager)',
  planner: 'Planner / Engineering',
  technician: 'ช่าง (Technician)',
}
