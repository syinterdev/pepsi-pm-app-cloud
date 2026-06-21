import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import type { PersonnelUserrole } from '../schemas/personnel-admin.js'
import { normalizePrimaryRolePair } from '../lib/primary-roles.js'
import { generateTemporaryPassword } from '../lib/password-policy.js'
import { getPasswordMinLength } from '../lib/security-settings.js'
import { hashPassword } from '../lib/password.js'
import { enrichAuthUser } from '../lib/role-labels.js'
import { mapWorkcenterRow, mapMemberRow } from './auth.js'

export async function listAdminMembers(pool: Pool): Promise<{
  items: Array<{
    id: number
    username: string
    fullname: string | null
    status: string | null
    lastLogin: string | null
    passMustChange: boolean
  }>
  total: number
}> {
  const { rows } = await pool.query<{
    id: number
    username: string
    fullname: string | null
    status: string | null
    last_login: Date | null
    pass_must_change: boolean
  }>(
    `SELECT id, username, fullname, status, last_login, pass_must_change
     FROM app.tbl_member
     ORDER BY username ASC`,
  )
  const items = rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullname: r.fullname,
    status: r.status,
    lastLogin: r.last_login ? new Date(r.last_login).toISOString() : null,
    passMustChange: r.pass_must_change === true,
  }))
  return { items, total: items.length }
}

export async function resetWorkcenterPassword(
  pool: Pool,
  idwkctr: string,
): Promise<{ temporaryPassword: string }> {
  const minLen = await getPasswordMinLength(pool)
  const plain = generateTemporaryPassword(minLen)
  const hashed = await hashPassword(plain)
  const { rowCount } = await pool.query(
    `UPDATE app.tbworkcenter
     SET pass = $2, pass_must_change = true, updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr, hashed],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { temporaryPassword: plain }
}

export async function resetMemberPassword(
  pool: Pool,
  memberId: number,
): Promise<{ temporaryPassword: string }> {
  const minLen = await getPasswordMinLength(pool)
  const plain = generateTemporaryPassword(minLen)
  const hashed = await hashPassword(plain)
  const { rowCount } = await pool.query(
    `UPDATE app.tbl_member
     SET password = $2, pass_must_change = true
     WHERE id = $1`,
    [memberId, hashed],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { temporaryPassword: plain }
}

export async function lockWorkcenter(pool: Pool, idwkctr: string): Promise<{ workstatus: string }> {
  const { rowCount } = await pool.query(
    `UPDATE app.tbworkcenter
     SET workstatus = 'INACTIVE', updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { workstatus: 'INACTIVE' }
}

export async function unlockWorkcenter(pool: Pool, idwkctr: string): Promise<{ workstatus: string }> {
  const { rowCount } = await pool.query(
    `UPDATE app.tbworkcenter
     SET workstatus = 'ACTIVE', updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { workstatus: 'ACTIVE' }
}

export async function lockMember(pool: Pool, memberId: number): Promise<{ status: string }> {
  const { rowCount } = await pool.query(
    `UPDATE app.tbl_member SET status = 'locked' WHERE id = $1`,
    [memberId],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { status: 'locked' }
}

export async function bulkUpdateWorkcenterUserrole(
  pool: Pool,
  idwkctrs: string[],
  userrole: PersonnelUserrole,
): Promise<{ updated: number }> {
  const unique = [...new Set(idwkctrs.map((id) => id.trim()).filter(Boolean))]
  if (unique.length < 1) return { updated: 0 }
  const { userst, userrole: role } = normalizePrimaryRolePair({ userrole })
  const { rowCount } = await pool.query(
    `UPDATE app.tbworkcenter
     SET userrole = $1, userst = $2, updated_at = now()
     WHERE idwkctr = ANY($3::text[])`,
    [role, userst, unique],
  )
  return { updated: rowCount ?? 0 }
}

export async function unlockMember(pool: Pool, memberId: number): Promise<{ status: string }> {
  const { rowCount } = await pool.query(
    `UPDATE app.tbl_member SET status = 'active' WHERE id = $1`,
    [memberId],
  )
  if ((rowCount ?? 0) < 1) throw new Error('NOT_FOUND')
  return { status: 'active' }
}

type WorkcenterAuthRow = {
  idwkctr: string
  pass: string
  wkctr: string
  plnt: string | null
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  titlewkctreng: string | null
  namewkctreng: string | null
  surnamewkctreng: string | null
  userst: string
  imgmember: string | null
  pass_must_change: boolean
}

type MemberAuthRow = {
  id: number
  username: string
  password: string
  fullname: string | null
  status: string | null
  pass_must_change: boolean
}

export async function loadAuthUserForImpersonation(
  pool: Pool,
  id: string,
  accountType: 'workcenter' | 'member',
): Promise<AuthUser | null> {
  if (accountType === 'member') {
    const memberId = Number(id.replace(/^mem:/, ''))
    if (!Number.isInteger(memberId) || memberId <= 0) return null
    const { rows } = await pool.query<MemberAuthRow>(
      `SELECT id, username, password, fullname, status, pass_must_change
       FROM app.tbl_member WHERE id = $1`,
      [memberId],
    )
    const row = rows[0]
    if (!row) return null
    const user = { ...mapMemberRow(row), passMustChange: row.pass_must_change === true }
    return enrichAuthUser(pool, user)
  }

  const { rows } = await pool.query<WorkcenterAuthRow>(
    `SELECT idwkctr, pass, wkctr, plnt, titlewkctr, namewkctr, surnamewkctr,
            titlewkctreng, namewkctreng, surnamewkctreng, userst, imgmember,
            pass_must_change
     FROM app.tbworkcenter WHERE idwkctr = $1`,
    [id],
  )
  const row = rows[0]
  if (!row) return null
  const user = { ...mapWorkcenterRow(row), passMustChange: row.pass_must_change === true }
  return enrichAuthUser(pool, user)
}

export function buildImpersonatedUser(
  target: AuthUser,
  admin: AuthUser,
): AuthUser {
  return {
    ...target,
    impersonatedBy: {
      idwkctr: admin.idwkctr,
      username: admin.username,
      userst: admin.userst,
    },
  }
}

/** Returns false when account must not log in (locked / inactive employment). */