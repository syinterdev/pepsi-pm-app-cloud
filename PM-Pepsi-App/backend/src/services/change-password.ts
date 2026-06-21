import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { validatePasswordMinLength } from '../lib/password-policy.js'
import { getPasswordMinLength } from '../lib/security-settings.js'
import { enrichAuthUser } from '../lib/role-labels.js'
import {
  loadWorkcenterRow,
  mapMemberRow,
  mapWorkcenterRow,
  type MemberRow,
} from './auth.js'

export type ChangePasswordErrorCode =
  | 'INVALID_CURRENT'
  | 'CONFIRM_MISMATCH'
  | 'VALIDATION'
  | 'SAME_PASSWORD'
  | 'NOT_FOUND'

export class ChangePasswordError extends Error {
  constructor(
    readonly code: ChangePasswordErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ChangePasswordError'
  }
}

export async function reloadAuthUser(pool: Pool, sessionUser: AuthUser): Promise<AuthUser | null> {
  if (sessionUser.accountType === 'member' && sessionUser.memId) {
    const r = await pool.query<MemberRow>(
      `SELECT id, username, password, fullname, status
       FROM app.tbl_member WHERE id = $1`,
      [Number(sessionUser.memId)],
    )
    const row = r.rows[0]
    if (!row) return null
    let user = mapMemberRow(row)
    user.passMustChange = await loadPassMustChange(pool, 'member', row.id)
    return enrichAuthUser(pool, user)
  }

  const row = await loadWorkcenterRow(pool, sessionUser.idwkctr)
  if (!row) return null
  let user = mapWorkcenterRow(row)
  user.passMustChange = await loadPassMustChange(pool, 'workcenter', sessionUser.idwkctr)
  return enrichAuthUser(pool, user)
}

async function loadPassMustChange(
  pool: Pool,
  kind: 'workcenter' | 'member',
  id: string | number,
): Promise<boolean> {
  try {
    if (kind === 'member') {
      const { rows } = await pool.query<{ pass_must_change: boolean }>(
        `SELECT pass_must_change FROM app.tbl_member WHERE id = $1`,
        [id],
      )
      return rows[0]?.pass_must_change === true
    }
    const { rows } = await pool.query<{ pass_must_change: boolean }>(
      `SELECT pass_must_change FROM app.tbworkcenter WHERE idwkctr = $1`,
      [String(id)],
    )
    return rows[0]?.pass_must_change === true
  } catch {
    return false
  }
}

export async function changePasswordForUser(
  pool: Pool,
  sessionUser: AuthUser,
  input: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  },
): Promise<AuthUser> {
  if (input.newPassword !== input.confirmPassword) {
    throw new ChangePasswordError('CONFIRM_MISMATCH', 'ยืนยันรหัสผ่านไม่ตรงกัน')
  }
  if (input.currentPassword === input.newPassword) {
    throw new ChangePasswordError('SAME_PASSWORD', 'รหัสผ่านใหม่ต้องต่างจากรหัสเดิม')
  }

  const minLen = await getPasswordMinLength(pool)
  const lengthCheck = validatePasswordMinLength(input.newPassword, minLen)
  if (!lengthCheck.ok) {
    throw new ChangePasswordError('VALIDATION', lengthCheck.message)
  }

  const hashed = await hashPassword(input.newPassword)

  if (sessionUser.accountType === 'member' && sessionUser.memId) {
    const memberId = Number(sessionUser.memId)
    const r = await pool.query<{ password: string }>(
      `SELECT password FROM app.tbl_member WHERE id = $1`,
      [memberId],
    )
    const row = r.rows[0]
    if (!row) throw new ChangePasswordError('NOT_FOUND', 'ไม่พบบัญชี')

    const verified = await verifyPassword(input.currentPassword, row.password)
    if (!verified.ok) {
      throw new ChangePasswordError('INVALID_CURRENT', 'รหัสผ่านเดิมไม่ถูกต้อง')
    }

    await pool.query(
      `UPDATE app.tbl_member SET password = $2, pass_must_change = false WHERE id = $1`,
      [memberId, hashed],
    )
  } else {
    const row = await loadWorkcenterRow(pool, sessionUser.idwkctr)
    if (!row) throw new ChangePasswordError('NOT_FOUND', 'ไม่พบบัญชี')

    const verified = await verifyPassword(input.currentPassword, row.pass)
    if (!verified.ok) {
      throw new ChangePasswordError('INVALID_CURRENT', 'รหัสผ่านเดิมไม่ถูกต้อง')
    }

    await pool.query(
      `UPDATE app.tbworkcenter
       SET pass = $2, pass_must_change = false, updated_at = now()
       WHERE idwkctr = $1`,
      [sessionUser.idwkctr, hashed],
    )
  }

  const refreshed = await reloadAuthUser(pool, sessionUser)
  if (!refreshed) throw new ChangePasswordError('NOT_FOUND', 'ไม่พบบัญชี')
  return refreshed
}
