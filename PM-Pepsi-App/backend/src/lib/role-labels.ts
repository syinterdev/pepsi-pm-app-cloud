import type { AuthUser } from '../schemas/auth.js'
import type { Pool } from 'pg'

export type RoleLabels = {
  roleNameTh: string
  roleNameEn: string
}

const FALLBACK_BY_CODE: Record<string, RoleLabels> = {
  A: { roleNameTh: 'ผู้ดูแลระบบ', roleNameEn: 'Administrator' },
  H: { roleNameTh: 'ผู้จัดการ / หัวหน้างาน', roleNameEn: 'Manager' },
  U: { roleNameTh: 'ผู้ใช้งานทั่วไป', roleNameEn: 'Planner' },
  W: { roleNameTh: 'ช่าง', roleNameEn: 'Technician' },
}

const MEMBER_LABELS: RoleLabels = {
  roleNameTh: 'สมาชิก',
  roleNameEn: 'Member',
}

export function fallbackRoleLabels(roleCode: string, accountType?: string): RoleLabels {
  if (accountType === 'member') return MEMBER_LABELS
  const code = roleCode.trim().toUpperCase()
  return (
    FALLBACK_BY_CODE[code] ?? {
      roleNameTh: 'ผู้ใช้งานทั่วไป',
      roleNameEn: 'User',
    }
  )
}

export async function fetchRoleLabels(
  pool: Pool,
  roleCode: string,
): Promise<RoleLabels | null> {
  const code = roleCode.trim().toUpperCase()
  if (!code) return null
  const { rows } = await pool.query<{ role_name: string; role_name_en: string }>(
    `SELECT role_name, role_name_en FROM app.tbl_role WHERE role_code = $1`,
    [code],
  )
  const row = rows[0]
  if (!row) return null
  const roleNameTh = row.role_name.trim()
  const roleNameEn = row.role_name_en.trim() || roleNameTh
  return { roleNameTh, roleNameEn }
}

export function pickRoleLabel(labels: RoleLabels, locale: 'en' | 'th'): string {
  return locale === 'en' ? labels.roleNameEn : labels.roleNameTh
}

export async function resolveRoleLabelsForUser(
  pool: Pool,
  userst: string,
  accountType?: AuthUser['accountType'],
): Promise<RoleLabels> {
  const fromDb = await fetchRoleLabels(pool, userst)
  if (fromDb) return fromDb
  return fallbackRoleLabels(userst, accountType)
}

export async function enrichAuthUser(pool: Pool, user: AuthUser): Promise<AuthUser> {
  const labels = await resolveRoleLabelsForUser(pool, user.userst, user.accountType)
  return {
    ...user,
    roleNameTh: labels.roleNameTh,
    roleNameEn: labels.roleNameEn,
    sysstatus: labels.roleNameTh,
  }
}
