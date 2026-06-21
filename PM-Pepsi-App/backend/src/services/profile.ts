import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import type { z } from 'zod'
import type { userProfileSchema } from '../schemas/profile.js'
import { resolveRoleLabelsForUser } from '../lib/role-labels.js'
import { timespanThai } from '../lib/timespan.js'
import { getWorktimeTotal } from './manhours.js'

type Profile = z.infer<typeof userProfileSchema>

export async function getProfileForUser(pool: Pool, user: AuthUser): Promise<Profile> {
  if (user.accountType === 'member' && user.memId) {
    const r = await pool.query<{
      id: number
      username: string
      fullname: string | null
      idcard: string | null
      bank: string | null
      bank_no: string | null
      branch: string | null
      last_login: Date | null
    }>(
      `SELECT id, username, fullname, idcard, bank, bank_no, branch, last_login
       FROM app.tbl_member WHERE id = $1`,
      [Number(user.memId)],
    )
    const row = r.rows[0]
    const displayName = row?.fullname?.trim() || user.username
    const roleLabels = await resolveRoleLabelsForUser(pool, user.userst, 'member')
    return {
      accountType: 'member',
      userId: user.memId,
      username: user.username,
      displayName,
      sysstatus: roleLabels.roleNameTh,
      roleNameTh: roleLabels.roleNameTh,
      roleNameEn: roleLabels.roleNameEn,
      userst: user.userst,
      fullnameTh: displayName,
      idcard: row?.idcard ?? undefined,
      bank: row?.bank ?? undefined,
      bankNo: row?.bank_no ?? undefined,
      branch: row?.branch ?? undefined,
      lastLogin: row?.last_login?.toISOString() ?? null,
    }
  }

  const r = await pool.query<{
    idwkctr: string
    wkctr: string
    plnt: string | null
    wkctrdate: string | null
    startwork: string | null
    titlewkctr: string | null
    namewkctr: string | null
    surnamewkctr: string | null
    titlewkctreng: string | null
    namewkctreng: string | null
    surnamewkctreng: string | null
    userst: string
    imgmember: string | null
    has_image: boolean
    last_login: Date | null
  }>(
    `SELECT idwkctr, wkctr, plnt, wkctrdate, startwork,
            titlewkctr, namewkctr, surnamewkctr,
            titlewkctreng, namewkctreng, surnamewkctreng,
            userst, imgmember,
            (octet_length(wc.imgmember_data) > 0) AS has_image,
            last_login
     FROM app.tbworkcenter wc WHERE idwkctr = $1`,
    [user.idwkctr],
  )
  const row = r.rows[0]
  const titleTh = row?.titlewkctr ?? ''
  const nameTh = row?.namewkctr ?? ''
  const surnameTh = row?.surnamewkctr ?? ''
  const titleEng = row?.titlewkctreng ?? ''
  const nameEng = row?.namewkctreng ?? ''
  const surnameEng = row?.surnamewkctreng ?? ''
  const bday = row?.wkctrdate != null ? Number(row.wkctrdate) : 0
  const start = row?.startwork != null ? Number(row.startwork) : 0

  let worktimeBreakdown: Awaited<ReturnType<typeof getWorktimeTotal>> = null
  try {
    worktimeBreakdown = await getWorktimeTotal(pool, user.idwkctr)
  } catch {
    /* tbmanhours ยังไม่ migrate */
  }

  const userst = row?.userst ?? user.userst
  const roleLabels = await resolveRoleLabelsForUser(pool, userst, 'workcenter')

  return {
    accountType: 'workcenter',
    userId: user.idwkctr,
    username: user.username,
    wkctr: row?.wkctr ?? user.wkctr,
    displayName: user.fullnameTh?.trim() || `${titleTh}${nameTh} ${surnameTh}`.trim(),
    sysstatus: roleLabels.roleNameTh,
    roleNameTh: roleLabels.roleNameTh,
    roleNameEn: roleLabels.roleNameEn,
    userst,
    plnt: row?.plnt,
    fullnameTh: user.fullnameTh,
    fullnameEng: user.fullnameEng,
    imgMember: row?.imgmember,
    hasImage: Boolean(row?.has_image),
    birthdayLabel: bday > 0 ? timespanThai(bday) : undefined,
    workAgeLabel: start > 0 ? timespanThai(start) : undefined,
    worktimeTotalHours: worktimeBreakdown?.total,
    worktimeBreakdown: worktimeBreakdown ?? undefined,
    lastLogin: row?.last_login?.toISOString() ?? null,
  }
}
