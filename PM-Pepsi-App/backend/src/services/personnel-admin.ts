/**
 * Admin CRUD ของ `app.tbworkcenter`
 * รวมถึงการ resolve lookup name → id ตอน import (()` ใน PHP)
 */
import type { Pool, PoolClient } from 'pg'
import bcrypt from 'bcryptjs'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import { isEngWkctrCode, normalizeWkctrCode, WkctrCodeConflictError } from '../lib/wkctr-code.js'
import { normalizePrimaryRolePair } from '../lib/primary-roles.js'
import type {
  PersonnelAdminItem,
  PersonnelAdminUpsertBody,
  PersonnelImportResponse,
  PersonnelImportRowResult,
  PersonnelUserrole,
  PersonnelWorkstatusOption,
} from '../schemas/personnel-admin.js'
import {
  parsePersonnelFile,
  type PersonnelImportParsedRow,
} from './personnel-import.js'
import { convertImageToWebp } from './personnel-image.js'
import { resolveUserRole } from '../lib/user-role.js'

type PersonnelRow = {
  idwkctr: string
  titlewkctr: string | null
  namewkctr: string | null
  surnamewkctr: string | null
  titlewkctreng: string | null
  namewkctreng: string | null
  surnamewkctreng: string | null
  startwork: string | null
  wkctrdate: string | null
  iddepartment: string | null
  department: string | null
  idposition: string | null
  position: string | null
  wkctr: string
  plnt: string | null
  cat: string | null
  resp: string | null
  idwkctrgroup: string | null
  wkctrgroup: string | null
  wkctrdescription: string | null
  idwkctrtype: string | null
  wkctrtype: string | null
  idwklevel: string | null
  wklevel: string | null
  wkctrtel: string | null
  wkctrmail: string | null
  labourcost: string | null
  userst: string
  userrole: PersonnelUserrole
  workstatus: string | null
  imgmember: string | null
  imgmember_mime: string | null
  imgmember_bytes: number | null
  has_image: boolean
  pass_must_change: boolean
  telegram_chat_id: string | null
  telegram_username: string | null
  telegram_linked_at: Date | null
}

const SELECT_BASE = `
  SELECT
    wc.idwkctr,
    wc.titlewkctr, wc.namewkctr, wc.surnamewkctr,
    wc.titlewkctreng, wc.namewkctreng, wc.surnamewkctreng,
    wc.startwork::text AS startwork,
    wc.wkctrdate::text AS wkctrdate,
    wc.iddepartment, dept.department,
    wc.idposition, pos.position,
    wc.wkctr, wc.plnt,
    wc.cat, wc.resp,
    wc.idwkctrgroup, grp.wkctrgroup, grp.wkctrdescription,
    wc.idwkctrtype, typ.wkctrtype,
    wc.idwklevel, lvl.wklevel,
    wc.wkctrtel, wc.wkctrmail,
    wc.labourcost::text AS labourcost,
    wc.userst, wc.userrole, wc.workstatus, wc.imgmember,
    wc.imgmember_mime,
    wc.imgmember_bytes,
    (octet_length(wc.imgmember_data) > 0) AS has_image,
    COALESCE(wc.pass_must_change, false) AS pass_must_change,
    wc.telegram_chat_id::text AS telegram_chat_id,
    wc.telegram_username,
    wc.telegram_linked_at
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
`

function mapRow(row: PersonnelRow): PersonnelAdminItem {
  return {
    idwkctr: row.idwkctr,
    titlewkctr: row.titlewkctr,
    namewkctr: row.namewkctr,
    surnamewkctr: row.surnamewkctr,
    titlewkctreng: row.titlewkctreng,
    namewkctreng: row.namewkctreng,
    surnamewkctreng: row.surnamewkctreng,
    startwork: row.startwork ? Number(row.startwork) : null,
    wkctrdate: row.wkctrdate ? Number(row.wkctrdate) : null,
    iddepartment: row.iddepartment,
    department: row.department,
    idposition: row.idposition,
    position: row.position,
    wkctr: row.wkctr,
    plnt: row.plnt,
    cat: row.cat,
    resp: row.resp,
    idwkctrgroup: row.idwkctrgroup,
    wkctrgroup: row.wkctrgroup,
    idwkctrtype: row.idwkctrtype,
    wkctrtype: row.wkctrtype,
    idwklevel: row.idwklevel,
    wklevel: row.wklevel,
    wkctrtel: row.wkctrtel,
    wkctrmail: row.wkctrmail,
    labourcost: row.labourcost ? Number(row.labourcost) : 0,
    userst: row.userst,
    userrole: row.userrole,
    workstatus: row.workstatus,
    imgmember: row.imgmember,
    imgmemberMime: row.imgmember_mime ?? 'image/webp',
    imgmemberBytes: row.imgmember_bytes ?? 0,
    hasImage: Boolean(row.has_image),
    passMustChange: row.pass_must_change === true,
    telegramChatId: row.telegram_chat_id,
    telegramUsername: row.telegram_username,
    telegramLinkedAt: row.telegram_linked_at?.toISOString() ?? null,
  }
}

/**
 * `status` filter — 4 รูปแบบ
 * - `all`      = ทุกคน (รวมลาออก/เกษียณ)
 * - `active` = `is_active=true` ใน tbwkctrstatus (default
 *                **รวมแถวที่ workstatus เป็น NULL/ว่าง** (data เก่าก่อน 039) เพื่อกันคนหาย
 * - `inactive` = `is_active=false`
 * - `<code>`   = match `tbworkcenter.workstatus = <code>` ตรง ๆ
 */
export type PersonnelListStatusFilter = 'all' | 'active' | 'inactive' | string

export async function listPersonnelAdmin(
  pool: Pool,
  opts: {
    q?: string
    limit?: number
    offset?: number
    status?: PersonnelListStatusFilter
    userrole?: PersonnelUserrole
  } = {},
): Promise<{ items: PersonnelAdminItem[]; totalRows: number }> {
  const limit = Math.max(1, Math.min(500, opts.limit ?? 200))
  const offset = Math.max(0, opts.offset ?? 0)
  const q = (opts.q ?? '').trim()
  const status = (opts.status ?? 'all').trim()
  const params: unknown[] = []
  const conds: string[] = []

  if (q) {
    params.push(`%${q.toLowerCase()}%`)
    const i = params.length
    conds.push(`(
      lower(wc.idwkctr) LIKE $${i} OR
      lower(coalesce(wc.namewkctr,'')) LIKE $${i} OR
      lower(coalesce(wc.surnamewkctr,'')) LIKE $${i} OR
      lower(coalesce(wc.namewkctreng,'')) LIKE $${i} OR
      lower(coalesce(wc.wkctr,'')) LIKE $${i}
    )`)
  }

  if (status === 'active') {
    conds.push(personnelIsActiveSql('wc'))
  } else if (status === 'inactive') {
    conds.push(`EXISTS (
      SELECT 1 FROM app.tbwkctrstatus s
      WHERE s.workstatus = wc.workstatus AND s.is_active = false
    )`)
  } else if (status && status !== 'all') {
    params.push(status)
    conds.push(`wc.workstatus = $${params.length}`)
  }

  if (opts.userrole) {
    params.push(opts.userrole)
    conds.push(`wc.userrole = $${params.length}`)
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

  const countRes = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app.tbworkcenter wc ${where}`,
    params,
  )
  params.push(limit, offset)
  const limitIdx = params.length - 1
  const offsetIdx = params.length

  const r = await pool.query<PersonnelRow>(
    `${SELECT_BASE} ${where}
     ORDER BY wc.idwkctr ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  )
  return {
    items: r.rows.map(mapRow),
    totalRows: Number(countRes.rows[0]?.n ?? '0'),
  }
}

/**
 * ดึงตัวเลือก workstatus (tbwkctrstatus) สำหรับ dropdown + filter
 * ส่งครบทุก row (รวม inactive) — frontend filter เองตามต้องการ
 */
export async function listPersonnelWorkstatuses(
  pool: Pool,
): Promise<PersonnelWorkstatusOption[]> {
  const r = await pool.query<{
    workstatus: string
    wkstatusdes: string
    wkstcolor: string | null
    is_active: boolean
    sort_order: number
  }>(`
    SELECT workstatus, wkstatusdes, wkstcolor, is_active, sort_order
    FROM app.tbwkctrstatus
    ORDER BY sort_order ASC, workstatus ASC
  `)
  return r.rows.map((row) => ({
    workstatus: row.workstatus,
    wkstatusdes: row.wkstatusdes,
    wkstcolor: row.wkstcolor,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }))
}

export async function getPersonnelAdminOne(
  pool: Pool,
  idwkctr: string,
): Promise<PersonnelAdminItem | null> {
  const r = await pool.query<PersonnelRow>(
    `${SELECT_BASE} WHERE wc.idwkctr = $1 LIMIT 1`,
    [idwkctr],
  )
  return r.rows[0] ? mapRow(r.rows[0]) : null
}

export async function deletePersonnelAdmin(
  pool: Pool,
  idwkctr: string,
): Promise<boolean> {
  const r = await pool.query(`DELETE FROM app.tbworkcenter WHERE idwkctr = $1`, [
    idwkctr,
  ])
  return (r.rowCount ?? 0) > 0
}

function parseDate(value: string | null | undefined): number | null {
  if (value == null) return null
  const t = value.trim()
  if (!t) return null
  const num = Number(t)
  if (Number.isFinite(num) && num > 1_000_000_000) return Math.floor(num)
  const parts = t.split(/[./-]/)
  if (parts.length >= 3) {
    const [a, b, c] = parts
    const day = Number(a)
    const month = Number(b)
    let year = Number(c)
    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
      if (year >= 2500) year -= 543
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const d = new Date(year, month - 1, day, 0, 0, 0, 0)
        const sec = Math.floor(d.getTime() / 1000)
        return sec > 0 ? sec : null
      }
    }
  }
  const fallback = new Date(t)
  if (!Number.isNaN(fallback.getTime())) {
    return Math.floor(fallback.getTime() / 1000)
  }
  return null
}

async function hashPasswordIfPresent(pw: string | undefined | null): Promise<string | null> {
  if (!pw || !pw.trim()) return null
  if (pw.startsWith('$2a$') || pw.startsWith('$2b$')) return pw
  return bcrypt.hash(pw, 10)
}

export async function assertWkctrCodeAvailable(
  pool: Pool,
  wkctr: string,
  excludeIdwkctr?: string,
): Promise<void> {
  const code = normalizeWkctrCode(wkctr)
  if (!code) return
  const r = await pool.query<{ idwkctr: string }>(
    `SELECT idwkctr FROM app.tbworkcenter
     WHERE wkctr = $1 AND ($2::text IS NULL OR idwkctr <> $2)
     LIMIT 1`,
    [code, excludeIdwkctr ?? null],
  )
  const hit = r.rows[0]
  if (hit) throw new WkctrCodeConflictError(code, hit.idwkctr)
}

export async function upsertPersonnelAdmin(
  pool: Pool,
  body: PersonnelAdminUpsertBody,
): Promise<{ idwkctr: string; mode: 'inserted' | 'updated' }> {
  const rolePair = normalizePrimaryRolePair(body)
  const normalizedBody = {
    ...body,
    wkctr: normalizeWkctrCode(body.wkctr),
    userst: rolePair.userst,
    userrole: rolePair.userrole,
  }
  await assertWkctrCodeAvailable(pool, normalizedBody.wkctr, normalizedBody.idwkctr)
  const startwork = parseDate(normalizedBody.startwork ?? null)
  const wkctrdate = parseDate(normalizedBody.wkctrdate ?? null)
  const hashedPass = await hashPasswordIfPresent(normalizedBody.pass)

  const existing = await pool.query<{ idwkctr: string }>(
    `SELECT idwkctr FROM app.tbworkcenter WHERE idwkctr = $1 LIMIT 1`,
    [normalizedBody.idwkctr],
  )

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE app.tbworkcenter SET
         titlewkctr = $2, namewkctr = $3, surnamewkctr = $4,
         titlewkctreng = $5, namewkctreng = $6, surnamewkctreng = $7,
         startwork = $8, wkctrdate = $9,
         iddepartment = $10, idposition = $11,
         wkctr = $12, plnt = $13,
         cat = $14, resp = $15,
         idwkctrgroup = $16, idwkctrtype = $17, idwklevel = $18,
         wkctrtel = $19, wkctrmail = $20,
         labourcost = $21,
         userst = $22, userrole = $23, workstatus = $24,
         pass = COALESCE($25, pass),
         updated_at = now()
       WHERE idwkctr = $1`,
      [
        normalizedBody.idwkctr,
        normalizedBody.titlewkctr ?? null,
        normalizedBody.namewkctr ?? null,
        normalizedBody.surnamewkctr ?? null,
        normalizedBody.titlewkctreng ?? null,
        normalizedBody.namewkctreng ?? null,
        normalizedBody.surnamewkctreng ?? null,
        startwork,
        wkctrdate,
        normalizedBody.iddepartment ?? null,
        normalizedBody.idposition ?? null,
        normalizedBody.wkctr,
        normalizedBody.plnt ?? null,
        normalizedBody.cat ?? null,
        normalizedBody.resp ?? null,
        normalizedBody.idwkctrgroup ?? null,
        normalizedBody.idwkctrtype ?? null,
        normalizedBody.idwklevel ?? null,
        normalizedBody.wkctrtel ?? null,
        normalizedBody.wkctrmail ?? null,
        normalizedBody.labourcost,
        normalizedBody.userst,
        normalizedBody.userrole,
        normalizedBody.workstatus ?? null,
        hashedPass,
      ],
    )
    return { idwkctr: normalizedBody.idwkctr, mode: 'updated' }
  }

  await pool.query(
    `INSERT INTO app.tbworkcenter (
       idwkctr, pass,
       titlewkctr, namewkctr, surnamewkctr,
       titlewkctreng, namewkctreng, surnamewkctreng,
       startwork, wkctrdate,
       iddepartment, idposition,
       wkctr, plnt, cat, resp,
       idwkctrgroup, idwkctrtype, idwklevel,
       wkctrtel, wkctrmail,
       labourcost, userst, userrole, workstatus
     ) VALUES (
       $1, COALESCE($25, ''),
       $2, $3, $4, $5, $6, $7,
       $8, $9,
       $10, $11,
       $12, $13, $14, $15,
       $16, $17, $18,
       $19, $20,
       $21, $22, $23, $24
     )`,
    [
      normalizedBody.idwkctr,
      normalizedBody.titlewkctr ?? null,
      normalizedBody.namewkctr ?? null,
      normalizedBody.surnamewkctr ?? null,
      normalizedBody.titlewkctreng ?? null,
      normalizedBody.namewkctreng ?? null,
      normalizedBody.surnamewkctreng ?? null,
      startwork,
      wkctrdate,
      normalizedBody.iddepartment ?? null,
      normalizedBody.idposition ?? null,
      normalizedBody.wkctr,
      normalizedBody.plnt ?? null,
      normalizedBody.cat ?? null,
      normalizedBody.resp ?? null,
      normalizedBody.idwkctrgroup ?? null,
      normalizedBody.idwkctrtype ?? null,
      normalizedBody.idwklevel ?? null,
      normalizedBody.wkctrtel ?? null,
      normalizedBody.wkctrmail ?? null,
      normalizedBody.labourcost,
      normalizedBody.userst,
      normalizedBody.userrole,
      normalizedBody.workstatus ?? null,
      hashedPass,
    ],
  )
  return { idwkctr: normalizedBody.idwkctr, mode: 'inserted' }
}

/**
 * เก็บภาพประจำตัวเป็น WebP ใน DB (`imgmember_data` BYTEA)
 * คืนชื่อไฟล์เพื่อใส่ใน `imgmember` ตามเดิมของ PHP (ใช้สำหรับอ้างอิงเท่านั้น — DB เก็บ binary จริง)
 */
export async function setPersonnelImage(
  pool: Pool,
  idwkctr: string,
  rawBuffer: Buffer,
): Promise<{ fileName: string; bytes: number; width: number; height: number } | null> {
  const converted = await convertImageToWebp(rawBuffer)
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)
    .toString(16)
    .padStart(5, '0')}`
  const fileName = `${idwkctr}_${stamp}.webp`

  const r = await pool.query(
    `UPDATE app.tbworkcenter SET
       imgmember = $2,
       imgmember_data = $3,
       imgmember_mime = 'image/webp',
       imgmember_bytes = $4,
       updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr, fileName, converted.data, converted.bytes],
  )
  if ((r.rowCount ?? 0) === 0) return null
  return {
    fileName,
    bytes: converted.bytes,
    width: converted.width,
    height: converted.height,
  }
}

export async function getPersonnelImage(
  pool: Pool,
  idwkctr: string,
): Promise<{ data: Buffer; mime: string; bytes: number; fileName: string } | null> {
  const r = await pool.query<{
    imgmember: string | null
    imgmember_data: Buffer | null
    imgmember_mime: string | null
    imgmember_bytes: number | null
  }>(
    `SELECT imgmember, imgmember_data, imgmember_mime, imgmember_bytes
     FROM app.tbworkcenter
     WHERE idwkctr = $1 LIMIT 1`,
    [idwkctr],
  )
  const row = r.rows[0]
  if (!row || !row.imgmember_data || row.imgmember_data.length === 0) return null
  return {
    data: row.imgmember_data,
    mime: row.imgmember_mime ?? 'image/webp',
    bytes: row.imgmember_bytes ?? row.imgmember_data.length,
    fileName: row.imgmember ?? `${idwkctr}.webp`,
  }
}

export async function clearPersonnelImage(pool: Pool, idwkctr: string): Promise<boolean> {
  const r = await pool.query(
    `UPDATE app.tbworkcenter SET
       imgmember = NULL,
       imgmember_data = NULL,
       imgmember_bytes = 0,
       updated_at = now()
     WHERE idwkctr = $1`,
    [idwkctr],
  )
  return (r.rowCount ?? 0) > 0
}

/* ───────────────────────── Import (Personel.xlsx) ───────────────────────── */

type LookupMap = Map<string, string>

async function buildLookup(
  client: PoolClient,
  table: string,
  idCol: string,
  nameCol: string,
): Promise<LookupMap> {
  const r = await client.query<Record<string, string>>(
    `SELECT ${idCol}::text AS id, ${nameCol}::text AS nm FROM app.${table}`,
  )
  const m: LookupMap = new Map()
  for (const row of r.rows) {
    const key = (row.nm ?? '').trim().toLowerCase()
    if (key) m.set(key, String(row.id))
  }
  return m
}

async function importOneRow(
  client: PoolClient,
  row: PersonnelImportParsedRow,
  lookup: {
    position: LookupMap
    wkctrgroup: LookupMap
    wkctrtype: LookupMap
    wklevel: LookupMap
  },
): Promise<PersonnelImportRowResult> {
  const idposition = row.positionName
    ? lookup.position.get(row.positionName.toLowerCase()) ?? null
    : null
  const idwkctrgroup = row.wkctrgroupName
    ? lookup.wkctrgroup.get(row.wkctrgroupName.toLowerCase()) ?? null
    : null
  const idwkctrtype = row.wkctrtypeName
    ? lookup.wkctrtype.get(row.wkctrtypeName.toLowerCase()) ?? null
    : null
  const idwklevel = row.wklevelName
    ? lookup.wklevel.get(row.wklevelName.toLowerCase()) ?? null
    : null

  const exists = await client.query<{ idwkctr: string }>(
    `SELECT idwkctr FROM app.tbworkcenter WHERE idwkctr = $1 LIMIT 1`,
    [row.idwkctr],
  )

  const hashedPass = row.pass ? await bcrypt.hash(row.pass, 10) : null
  const userrole = resolveUserRole(row.userrole, row.userst, row.positionName)

  if (exists.rows.length > 0) {
    await client.query(
      `UPDATE app.tbworkcenter SET
         titlewkctr=$2, namewkctr=$3, surnamewkctr=$4,
         titlewkctreng=$5, namewkctreng=$6, surnamewkctreng=$7,
         startwork=$8, wkctrdate=$9,
         iddepartment=$10, idposition=$11,
         wkctr=$12, plnt=$13, cat=$14, resp=$15,
         idwkctrgroup=$16, idwkctrtype=$17, idwklevel=$18,
         wkctrtel=$19, wkctrmail=$20,
         labourcost=$21, userst=$22, userrole=$23,
         pass = COALESCE($24, pass),
         updated_at = now()
       WHERE idwkctr=$1`,
      [
        row.idwkctr,
        row.titlewkctr || null,
        row.namewkctr || null,
        row.surnamewkctr || null,
        row.titlewkctreng || null,
        row.namewkctreng || null,
        row.surnamewkctreng || null,
        row.startwork,
        row.wkctrdate,
        row.iddepartment || null,
        idposition,
        row.wkctr,
        row.plnt || null,
        row.cat || null,
        row.resp || null,
        idwkctrgroup,
        idwkctrtype,
        idwklevel,
        row.wkctrtel || null,
        row.wkctrmail || null,
        row.labourcost,
        row.userst,
        userrole,
        hashedPass,
      ],
    )
    return { rowNo: row.rowNo, idwkctr: row.idwkctr, action: 'updated' }
  }

  await client.query(
    `INSERT INTO app.tbworkcenter (
       idwkctr, pass,
       titlewkctr, namewkctr, surnamewkctr,
       titlewkctreng, namewkctreng, surnamewkctreng,
       startwork, wkctrdate,
       iddepartment, idposition,
       wkctr, plnt, cat, resp,
       idwkctrgroup, idwkctrtype, idwklevel,
       wkctrtel, wkctrmail,
       labourcost, userst, userrole
     ) VALUES (
       $1, COALESCE($24, ''),
       $2, $3, $4, $5, $6, $7,
       $8, $9,
       $10, $11,
       $12, $13, $14, $15,
       $16, $17, $18,
       $19, $20,
       $21, $22, $23
     )`,
    [
      row.idwkctr,
      row.titlewkctr || null,
      row.namewkctr || null,
      row.surnamewkctr || null,
      row.titlewkctreng || null,
      row.namewkctreng || null,
      row.surnamewkctreng || null,
      row.startwork,
      row.wkctrdate,
      row.iddepartment || null,
      idposition,
      row.wkctr,
      row.plnt || null,
      row.cat || null,
      row.resp || null,
      idwkctrgroup,
      idwkctrtype,
      idwklevel,
      row.wkctrtel || null,
      row.wkctrmail || null,
      row.labourcost,
      row.userst,
      userrole,
      hashedPass,
    ],
  )
  return { rowNo: row.rowNo, idwkctr: row.idwkctr, action: 'inserted' }
}

export async function importPersonnelFile(
  pool: Pool,
  opts: { fileName: string; buffer: Buffer },
): Promise<PersonnelImportResponse> {
  const parsed = parsePersonnelFile(opts.buffer)
  const rows: PersonnelImportRowResult[] = []
  let inserted = 0
  let updated = 0
  let skipped = 0
  let errorsCount = 0

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const lookup = {
      position: await buildLookup(client, 'tbposition', 'idposition', 'position'),
      wkctrgroup: await buildLookup(
        client,
        'tbwkctrgroup',
        'idwkctrgroup',
        'wkctrgroup',
      ),
      wkctrtype: await buildLookup(
        client,
        'tbwkctrtype',
        'idwkctrtype',
        'wkctrtype',
      ),
      wklevel: await buildLookup(client, 'tbwklevel', 'idwklevel', 'wklevel'),
    }

    for (const p of parsed) {
      if (p.kind === 'error') {
        errorsCount++
        rows.push({
          rowNo: p.rowNo,
          idwkctr: p.idwkctr,
          action: 'error',
          message: p.message,
        })
        continue
      }

      try {
        const res = await importOneRow(client, p.row, lookup)
        rows.push(res)
        if (res.action === 'inserted') inserted++
        else if (res.action === 'updated') updated++
        else if (res.action === 'skipped') skipped++
      } catch (err) {
        errorsCount++
        rows.push({
          rowNo: p.row.rowNo,
          idwkctr: p.row.idwkctr,
          action: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return {
    fileName: opts.fileName,
    totalRows: parsed.length,
    inserted,
    updated,
    skipped,
    errors: errorsCount,
    rows,
  }
}
