/**
 * Personal Dashboard service — รวมข้อมูลของ user ปัจจุบันจากหลายตาราง:
 * - profile: `app.tbworkcenter` + ลุก lookup `tbposition`, `tbdepartment`, `tbwkctrgroup`, `tbwkctrtype`, `tbwklevel`
 *
 * - planning: `app.view_planwork` กรอง `idwkctr` ของผู้ใช้ (open/closed count + recent open)
 * - confirmation: `app.tbcofirm` (และ `tbiw37n` สำหรับ `wkorder`) กรองด้วย `wkctr` ของผู้ใช้
 * เพื่อสรุปจำนวนงานปิด + รวมเวลา
 * - worktime: ใช้ `getWorktimeTotal`
 *
 * หมายเหตุ: หาก view/ตารางบางส่วนยังไม่ migrate จะคืน 0 / [] เพื่อให้ UI ใช้งานได้แม้ data ไม่พร้อม
 */
import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import type { PersonnelDashboardResponse } from '../schemas/personnel.js'
import { timespanThai } from '../lib/timespan.js'
import { ROLE_LABEL_TH, resolveUserRole, type UserRole } from '../lib/user-role.js'
import { getWorktimeTotal } from './manhours.js'

type ProfileRow = {
  idwkctr: string
  wkctr: string
  plnt: string | null
  userst: string
  userrole: string | null
  imgmember: string | null
  wkctrdate: string | null
  startwork: string | null
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  iddepartment: string | null
  department: string | null
  idposition: string | null
  position: string | null
  idwkctrgroup: string | null
  wkctrdescription: string | null
  idwkctrtype: string | null
  wkctrtype: string | null
  idwklevel: string | null
  wklevel: string | null
  wkctrmail: string | null
  wkctrtel: string | null
  last_login: Date | null
}

function unixToIsoDate(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  const d = new Date(n * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function safeQuery<Row extends Record<string, unknown>>(
  pool: Pool,
  text: string,
  params: unknown[],
  fallback: Row[],
): Promise<Row[]> {
  try {
    const r = await pool.query<Row>(text, params as unknown[])
    return r.rows
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (
      msg.includes('does not exist') ||
      msg.includes('undefined table') ||
      msg.includes('relation')
    ) {
      return fallback
    }
    throw err
  }
}

async function loadProfile(pool: Pool, user: AuthUser): Promise<ProfileRow | null> {
  const r = await pool.query<ProfileRow>(
    `SELECT
       wc.idwkctr,
       wc.wkctr,
       wc.plnt,
       wc.userst,
       wc.userrole,
       wc.imgmember,
       wc.wkctrdate::text AS wkctrdate,
       wc.startwork::text AS startwork,
       wc.titlewkctr,
       wc.namewkctr,
       wc.surnamewkctr,
       wc.iddepartment,
       dept.department,
       wc.idposition,
       pos.position,
       wc.idwkctrgroup,
       grp.wkctrdescription,
       wc.idwkctrtype,
       typ.wkctrtype,
       wc.idwklevel,
       lvl.wklevel,
       NULL::text AS wkctrmail,
       NULL::text AS wkctrtel,
       wc.last_login
     FROM app.tbworkcenter wc
     LEFT JOIN app.tbdepartment dept
       ON dept.iddepartment::text = wc.iddepartment::text
     LEFT JOIN app.tbposition pos
       ON pos.idposition::text = wc.idposition::text
     LEFT JOIN app.tbwkctrgroup grp
       ON grp.idwkctrgroup::text = wc.idwkctrgroup::text
     LEFT JOIN app.tbwkctrtype typ
       ON typ.idwkctrtype::text = wc.idwkctrtype::text
     LEFT JOIN app.tbwklevel lvl
       ON lvl.idwklevel::text = wc.idwklevel::text
     WHERE wc.idwkctr = $1
     LIMIT 1`,
    [user.idwkctr],
  )
  return r.rows[0] ?? null
}

type PlanRow = {
  idiw37: number
  wkorder: string
  wktype: string | null
  operationshorttext: string | null
  functionalloc: string | null
  equdescrip: string | null
  bscstart: string | null
  syst: string | null
}

type PlanCountRow = { syst: string | null; n: string }

type ConfirmRow = {
  idclose: number
  idiw37: number
  wkorder: string | null
  confirmation: string
  wkctr: string
  timewk: number
  unitc: string
  stdate: string | null
  endate: string | null
  timeclose: string | null
}

type ConfirmSumRow = { total_close: string; total_minutes: string }

type TeamMemberRow = {
  idwkctr: string
  display_name: string
  position: string | null
  work_group: string | null
  open_count: string | null
  closed_count: string | null
  total_minutes: string | null
}

type UnassignedRow = {
  idiw37: number
  wkorder: string
  wktype: string | null
  operationshorttext: string | null
  equdescrip: string | null
  functionalloc: string | null
  bscstart: string | null
  syst: string | null
  wkctr: string | null
}

type GlobalSumRow = {
  open_total: string
  close_today: string
  assigned_total: string
}

async function loadRoleData(
  pool: Pool,
  role: UserRole,
  user: AuthUser,
  profileGroupCode: string | null,
  profileGroupName: string | null,
) {
  // Admin + Planner ใช้ภาพรวมโรงงาน + unassigned list
  // Manager ใช้สรุปทีม (กลุ่มงานเดียวกัน)
  // Technician ไม่มีข้อมูลเฉพาะเพิ่ม (ใช้ฝั่งของตน)

  if (role === 'technician') {
    return {} as PersonnelDashboardResponse['roleData']
  }

  const out: PersonnelDashboardResponse['roleData'] = {}

  if (role === 'admin' || role === 'planner') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startToday = Math.floor(today.getTime() / 1000)

    const [globalSum, unassigned] = await Promise.all([
      safeQuery<GlobalSumRow>(
        pool,
        `SELECT
           COUNT(*) FILTER (WHERE i.syst IN ('CRTD','REL'))::text AS open_total,
           COUNT(*) FILTER (WHERE i.syst IN ('TECO','COMP') AND COALESCE(i.actfinish,0) >= $1)::text AS close_today,
           COUNT(*) FILTER (WHERE i.syst IN ('CRTD','REL') AND EXISTS (
             SELECT 1 FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37
           ))::text AS assigned_total
         FROM app.tbiw37n i`,
        [startToday],
        [],
      ),
      safeQuery<UnassignedRow>(
        pool,
        `SELECT i.idiw37, i.wkorder, i.wktype, i.operationshorttext, i.equdescrip,
                i.functionalloc, i.bscstart::text AS bscstart, i.syst, i.wkctr
         FROM app.tbiw37n i
         WHERE i.syst IN ('CRTD','REL')
           AND NOT EXISTS (SELECT 1 FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37)
         ORDER BY i.bscstart ASC NULLS LAST
         LIMIT 10`,
        [],
        [],
      ),
    ])

    const g = globalSum[0]
    out.global = g
      ? {
          openTotal: Number(g.open_total ?? 0),
          closeToday: Number(g.close_today ?? 0),
          assignedTotal: Number(g.assigned_total ?? 0),
        }
      : null

    out.unassigned = {
      total: unassigned.length,
      items: unassigned.map((u) => ({
        idiw37: Number(u.idiw37),
        wkorder: u.wkorder,
        wktype: u.wktype?.trim() ?? null,
        shortText: u.operationshorttext?.trim() ?? null,
        equipment: u.equdescrip?.trim() ?? null,
        functionalLoc: u.functionalloc?.trim() ?? null,
        bscStart: unixToIsoDate(u.bscstart),
        syst: u.syst?.trim() ?? null,
        wkctr: u.wkctr?.trim() ?? null,
      })),
    }
  }

  if (role === 'manager') {
    // ทีม = สมาชิกใน idwkctrgroup เดียวกัน (ดึงจาก tbworkcenter)
    const groupCode = profileGroupCode
    if (groupCode) {
      const members = await safeQuery<TeamMemberRow>(
        pool,
        `WITH team AS (
           SELECT wc.idwkctr,
                  TRIM(CONCAT(COALESCE(wc.titlewkctr,''), COALESCE(wc.namewkctr,''), ' ', COALESCE(wc.surnamewkctr,''))) AS display_name,
                  pos.position,
                  grp.wkctrdescription AS work_group,
                  wc.wkctr
           FROM app.tbworkcenter wc
           LEFT JOIN app.tbposition pos ON pos.idposition::text = wc.idposition::text
           LEFT JOIN app.tbwkctrgroup grp ON grp.idwkctrgroup::text = wc.idwkctrgroup::text
           WHERE wc.idwkctrgroup::text = $1
             AND wc.idwkctr <> $2
         )
         SELECT t.idwkctr, t.display_name, t.position, t.work_group,
                (SELECT COUNT(*) FROM app.view_planwork v WHERE v.idwkctr = t.idwkctr AND v.syst IN ('CRTD','REL'))::text AS open_count,
                (SELECT COUNT(*) FROM app.view_planwork v WHERE v.idwkctr = t.idwkctr AND v.syst NOT IN ('CRTD','REL'))::text AS closed_count,
                COALESCE((
                  SELECT SUM(CASE WHEN c.unitc = 'H' THEN c.timewk * 60 ELSE c.timewk END)
                  FROM app.tbcofirm c WHERE c.cwkctr = t.idwkctr OR c.wkctr = t.wkctr
                ),0)::text AS total_minutes
         FROM team t
         ORDER BY t.display_name ASC`,
        [groupCode, user.idwkctr],
        [],
      )

      const memberArr = members.map((m) => ({
        idwkctr: m.idwkctr,
        displayName: m.display_name?.trim() || m.idwkctr,
        position: m.position?.trim() ?? null,
        workGroup: m.work_group?.trim() ?? null,
        openCount: Number(m.open_count ?? 0),
        closedCount: Number(m.closed_count ?? 0),
        totalMinutes: Number(m.total_minutes ?? 0),
      }))

      out.team = {
        groupCode,
        groupName: profileGroupName,
        totalOpen: memberArr.reduce((s, m) => s + m.openCount, 0),
        totalClose: memberArr.reduce((s, m) => s + m.closedCount, 0),
        members: memberArr,
      }
    } else {
      out.team = {
        groupCode: null,
        groupName: null,
        totalOpen: 0,
        totalClose: 0,
        members: [],
      }
    }
  }

  return out
}

export async function getPersonnelDashboard(
  pool: Pool,
  user: AuthUser,
): Promise<PersonnelDashboardResponse> {
  const [profileRow, planCounts, recentPlanOpen, confirmSum, recentConfirm, worktime] =
    await Promise.all([
      loadProfile(pool, user).catch(() => null),
      safeQuery<PlanCountRow>(
        pool,
        `SELECT
           CASE WHEN syst IN ('CRTD', 'REL') THEN 'open' ELSE 'closed' END AS syst,
           COUNT(*)::text AS n
         FROM app.view_planwork
         WHERE idwkctr = $1
         GROUP BY 1`,
        [user.idwkctr],
        [],
      ),
      safeQuery<PlanRow>(
        pool,
        `SELECT idiw37, wkorder, wktype, operationshorttext, functionalloc, equdescrip,
                bscstart::text AS bscstart, syst
         FROM app.view_planwork
         WHERE idwkctr = $1 AND syst IN ('CRTD', 'REL')
         ORDER BY bscstart DESC NULLS LAST
         LIMIT 5`,
        [user.idwkctr],
        [],
      ),
      safeQuery<ConfirmSumRow>(
        pool,
        `SELECT
           COUNT(*)::text AS total_close,
           COALESCE(SUM(
             CASE WHEN unitc = 'H' THEN timewk * 60 ELSE timewk END
           ), 0)::text AS total_minutes
         FROM app.tbcofirm
         WHERE cwkctr IN ($1, $2) OR wkctr = $2`,
        [user.idwkctr, user.wkctr],
        [{ total_close: '0', total_minutes: '0' }],
      ),
      safeQuery<ConfirmRow>(
        pool,
        `SELECT c.idclose, c.idiw37, i.wkorder, c.confirmation, c.wkctr,
                c.timewk, c.unitc,
                c.stdate::text AS stdate,
                c.endate::text AS endate,
                c.timeclose::text AS timeclose
         FROM app.tbcofirm c
         LEFT JOIN app.tbiw37n i ON i.idiw37 = c.idiw37
         WHERE c.cwkctr IN ($1, $2) OR c.wkctr = $2
         ORDER BY c.timeclose DESC NULLS LAST, c.idclose DESC
         LIMIT 10`,
        [user.idwkctr, user.wkctr],
        [],
      ),
      getWorktimeTotal(pool, user.idwkctr).catch(() => null),
    ])

  const titleTh = profileRow?.titlewkctr?.trim() ?? ''
  const nameTh = profileRow?.namewkctr?.trim() ?? ''
  const surnameTh = profileRow?.surnamewkctr?.trim() ?? ''
  const displayName =
    user.fullnameTh?.trim() ||
    `${titleTh}${nameTh} ${surnameTh}`.trim() ||
    user.username

  const bday = profileRow?.wkctrdate ? Number(profileRow.wkctrdate) : 0
  const start = profileRow?.startwork ? Number(profileRow.startwork) : 0

  const openCount = Number(
    planCounts.find((c) => c.syst === 'open')?.n ?? '0',
  )
  const closedCount = Number(
    planCounts.find((c) => c.syst === 'closed')?.n ?? '0',
  )

  const sumRow = confirmSum[0] ?? { total_close: '0', total_minutes: '0' }

  const role = resolveUserRole(
    profileRow?.userrole ?? null,
    profileRow?.userst ?? user.userst,
    profileRow?.position ?? null,
  )
  const roleLabel = ROLE_LABEL_TH[role]

  const roleData = await loadRoleData(
    pool,
    role,
    user,
    profileRow?.idwkctrgroup ?? null,
    profileRow?.wkctrdescription ?? null,
  ).catch(() => ({}) as PersonnelDashboardResponse['roleData'])

  return {
    role,
    roleLabel,
    profile: {
      accountType: user.accountType ?? 'workcenter',
      idwkctr: user.idwkctr,
      username: user.username,
      displayName,
      wkctr: profileRow?.wkctr ?? user.wkctr,
      plnt: profileRow?.plnt ?? null,
      userst: profileRow?.userst ?? user.userst,
      userRole: role,
      position: profileRow?.position ?? null,
      department: profileRow?.department ?? null,
      workGroup: profileRow?.wkctrdescription ?? null,
      workType: profileRow?.wkctrtype ?? null,
      workLevel: profileRow?.wklevel ?? null,
      email: profileRow?.wkctrmail ?? null,
      tel: profileRow?.wkctrtel ?? null,
      imgMember: profileRow?.imgmember ?? null,
      birthdayLabel: bday > 0 ? timespanThai(bday) : null,
      workAgeLabel: start > 0 ? timespanThai(start) : null,
      birthdayDate: unixToIsoDate(bday),
      startWorkDate: unixToIsoDate(start),
      lastLogin: profileRow?.last_login?.toISOString() ?? null,
    },
    planning: {
      openCount,
      closedCount,
      recent: recentPlanOpen.map((r) => ({
        idiw37: Number(r.idiw37),
        wkorder: r.wkorder,
        wktype: r.wktype?.trim() ?? null,
        shortText: r.operationshorttext?.trim() ?? null,
        functionalLoc: r.functionalloc?.trim() ?? null,
        equipment: r.equdescrip?.trim() ?? null,
        bscStart: unixToIsoDate(r.bscstart),
        syst: r.syst?.trim() ?? null,
      })),
    },
    confirmation: {
      totalClose: Number(sumRow.total_close),
      totalMinutes: Number(sumRow.total_minutes),
      recent: recentConfirm.map((r) => ({
        idclose: Number(r.idclose),
        idiw37: Number(r.idiw37),
        wkorder: r.wkorder ?? '',
        confirmation: r.confirmation,
        wkctr: r.wkctr,
        timewk: Number(r.timewk),
        unitc: r.unitc,
        stdate: unixToIsoDate(r.stdate),
        endate: unixToIsoDate(r.endate),
        timeclose: unixToIsoDate(r.timeclose),
      })),
    },
    worktime: worktime ?? null,
    roleData,
  }
}
