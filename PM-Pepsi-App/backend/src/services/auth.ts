import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import { enrichAuthUser } from '../lib/role-labels.js'
import { hashPassword, verifyPassword } from '../lib/password.js'

type WorkcenterRow = {
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
}

export type MemberRow = {
  id: number
  username: string
  password: string
  fullname: string | null
  status: string | null
}

function mapSysstatus(userst: string): { sysstatus: string; userLevel?: number } {
  switch (userst) {
    case 'A':
      return { sysstatus: 'ผู้ดูแลระบบ', userLevel: 1 }
    case 'W':
      return { sysstatus: 'ช่าง', userLevel: 2 }
    case 'U':
    default:
      return { sysstatus: 'ผู้ใช้งานทั่วไป' }
  }
}

export function mapWorkcenterRow(row: WorkcenterRow): AuthUser {
  const titleTh = row.titlewkctr ?? ''
  const nameTh = row.namewkctr ?? ''
  const surnameTh = row.surnamewkctr ?? ''
  const titleEng = row.titlewkctreng ?? ''
  const nameEng = row.namewkctreng ?? ''
  const surnameEng = row.surnamewkctreng ?? ''
  const { sysstatus, userLevel } = mapSysstatus(row.userst)

  return {
    idwkctr: row.idwkctr,
    username: row.wkctr,
    wkctr: row.wkctr,
    plnt: row.plnt,
    userst: row.userst,
    sysstatus,
    userLevel,
    fullnameTh: `${titleTh}${nameTh}  ${surnameTh}`.trim(),
    fullnameEng: `${titleEng}${nameEng}  ${surnameEng}`.trim(),
    titlewkctr: row.titlewkctr ?? undefined,
    namewkctr: row.namewkctr ?? undefined,
    surnamewkctr: row.surnamewkctr ?? undefined,
    imgMember: row.imgmember,
    accountType: 'workcenter',
  }
}

export function mapMemberRow(row: MemberRow): AuthUser {
  const fullname = row.fullname?.trim() || row.username
  return {
    idwkctr: `mem:${row.id}`,
    username: row.username,
    wkctr: row.username,
    userst: 'U',
    sysstatus: 'สมาชิก',
    userLevel: 2,
    fullnameTh: fullname,
    fullnameEng: fullname,
    accountType: 'member',
    memId: String(row.id),
  }
}

export async function loadWorkcenterRow(
  pool: Pool,
  idwkctr: string,
): Promise<(WorkcenterRow & { pass: string }) | null> {
  const r = await pool.query<WorkcenterRow & { pass: string }>(
    `SELECT idwkctr, pass, wkctr, plnt, titlewkctr, namewkctr, surnamewkctr,
            titlewkctreng, namewkctreng, surnamewkctreng, userst, imgmember
     FROM app.tbworkcenter
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  return r.rows[0] ?? null
}

/** Work center login — รองรับ plain text และ bcrypt ใน `pass` */
export async function findWorkcenterByCredentials(
  pool: Pool,
  idwkctr: string,
  plainPassword: string,
): Promise<AuthUser | null> {
  const row = await loadWorkcenterRow(pool, idwkctr)
  if (!row) return null

  const allowed = await isWorkcenterAccountActive(pool, idwkctr)
  if (!allowed) return null

  const { ok, needsRehash } = await verifyPassword(plainPassword, row.pass)
  if (!ok) return null

  if (needsRehash) {
    const hashed = await hashPassword(plainPassword)
    await pool.query(`UPDATE app.tbworkcenter SET pass = $1 WHERE idwkctr = $2`, [
      hashed,
      idwkctr,
    ])
  }

  let user = mapWorkcenterRow(row)
  user.passMustChange = await loadPassMustChangeFlag(pool, 'workcenter', idwkctr)
  user = await enrichAuthUser(pool, user)
  return user
}

async function isWorkcenterAccountActive(pool: Pool, idwkctr: string): Promise<boolean> {
  const { rows } = await pool.query<{ workstatus: string | null; is_active: boolean | null }>(
    `SELECT wc.workstatus, s.is_active
     FROM app.tbworkcenter wc
     LEFT JOIN app.tbwkctrstatus s ON s.workstatus = wc.workstatus
     WHERE wc.idwkctr = $1`,
    [idwkctr],
  )
  const row = rows[0]
  if (!row) return false
  if (row.workstatus === 'INACTIVE') return false
  if (row.is_active === false) return false
  return true
}

async function loadPassMustChangeFlag(
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

/** Member login — tbl_member */
export async function findMemberByCredentials(
  pool: Pool,
  username: string,
  plainPassword: string,
): Promise<AuthUser | null> {
  const r = await pool.query<MemberRow>(
    `SELECT id, username, password, fullname, status
     FROM app.tbl_member
     WHERE username = $1 AND COALESCE(status, 'active') NOT IN ('locked', 'inactive')`,
    [username],
  )
  const row = r.rows[0]
  if (!row) return null

  const { ok, needsRehash } = await verifyPassword(plainPassword, row.password)
  if (!ok) return null

  if (needsRehash) {
    const hashed = await hashPassword(plainPassword)
    await pool.query(`UPDATE app.tbl_member SET password = $1 WHERE id = $2`, [hashed, row.id])
  }

  await pool.query(`UPDATE app.tbl_member SET last_login = now() WHERE id = $1`, [row.id])

  let user = mapMemberRow(row)
  user.passMustChange = await loadPassMustChangeFlag(pool, 'member', row.id)
  user = await enrichAuthUser(pool, user)
  return user
}

export async function insertUserLog(
  pool: Pool,
  opts: {
    userId: string
    username: string
    userIp: string | null
    myIp: string | null
    action: 'in' | 'out'
    accountType?: 'workcenter' | 'member'
  },
): Promise<void> {
  if (opts.accountType === 'member') {
    await pool.query(
      `INSERT INTO app.tbl_system_userlog (user_id, username, user_ip, my_ip, action)
       VALUES ($1, $2, $3, $4, $5)`,
      [opts.userId, opts.username, opts.userIp, opts.myIp, opts.action],
    )
    return
  }
  await pool.query(
    `INSERT INTO app.tbworkcenter_userlog (user_id, username, user_ip, my_ip, action)
     VALUES ($1, $2, $3, $4, $5)`,
    [opts.userId, opts.username, opts.userIp, opts.myIp, opts.action],
  )
}

type UserLogRow = {
  id: number
  user_ip: string | null
  my_ip: string | null
  action: string
  created_at: Date | string
}

export type UserLogItem = {
  id: number
  actionTime: string
  action: string
  userIp: string | null
  myIp: string | null
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export async function listUserLogs(
  pool: Pool,
  opts: { userId: string; accountType: 'workcenter' | 'member'; limit: number; offset: number },
): Promise<UserLogItem[]> {
  const table = opts.accountType === 'member' ? 'app.tbl_system_userlog' : 'app.tbworkcenter_userlog'

  const r = await pool.query<UserLogRow>(
    `SELECT id, user_ip, my_ip, action, created_at
     FROM ${table}
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [opts.userId, opts.limit, opts.offset],
  )

  return r.rows.map((row) => ({
    id: Number(row.id),
    actionTime: toIsoString(row.created_at),
    action: row.action,
    userIp: row.user_ip,
    myIp: row.my_ip,
  }))
}

