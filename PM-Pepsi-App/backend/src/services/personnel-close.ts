import type { Pool } from 'pg'
import { touchConfirmQcPending } from './confirm-qc.js'

function parseDdMmYyyy(v: string): { dd: number; mm: number; yyyy: number } | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v.trim())
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1970 || yyyy > 2100) return null
  return { dd, mm, yyyy }
}

function parseHhMm(v: string): { hh: number; min: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return null
  const hh = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(min)) return null
  if (hh < 0 || hh > 23 || min < 0 || min > 59) return null
  return { hh, min }
}

function computeEpochSeconds(d: { dd: number; mm: number; yyyy: number }, t: { hh: number; min: number }): number {
  const dt = new Date(d.yyyy, d.mm - 1, d.dd, t.hh, t.min, 0, 0)
  return Math.floor(dt.getTime() / 1000)
}

function durationMinutes(stSec: number, enSec: number): number {
  const diff = enSec - stSec
  if (!Number.isFinite(diff) || diff <= 0) return 0
  return Math.floor(diff / 60)
}

export type PersonnelCloseItem = {
  idwrkclose: number
  idiw37: number
  wkctr: string
  displayName: string
  cstdate: number
  cendate: number
  wktimewk: number
  wkunit: string
}

import { displayNameFromWkctrRow } from '../lib/wkctr-display-name.js'

export async function listPersonnelCloses(pool: Pool, idiw37: number): Promise<PersonnelCloseItem[]> {
  const r = await pool.query<{
    idwrkclose: number
    idiw37: number
    wkctr: string
    cstdate: string
    cendate: string
    wktimewk: number
    wkunit: string
    titlewkctr: string | null
    namewkctr: string | null
    surnamewkctr: string | null
    titlewkctreng: string | null
    namewkctreng: string | null
    surnamewkctreng: string | null
  }>(
    `SELECT
       v.idwrkclose,
       v.idiw37,
       v.wkctr,
       v.cstdate,
       v.cendate,
       v.wktimewk,
       v.wkunit,
       v.titlewkctr,
       v.namewkctr,
       v.surnamewkctr,
       v.titlewkctreng,
       v.namewkctreng,
       v.surnamewkctreng
     FROM app.view_personelclose v
     WHERE v.idiw37 = $1
     ORDER BY v.wkctr`,
    [idiw37],
  )
  return r.rows.map((row) => ({
    idwrkclose: row.idwrkclose,
    idiw37: row.idiw37,
    wkctr: row.wkctr,
    displayName: displayNameFromWkctrRow(row),
    cstdate: Number(row.cstdate),
    cendate: Number(row.cendate),
    wktimewk: row.wktimewk,
    wkunit: row.wkunit,
  }))
}

function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function formatHhMm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function insertPersonnelCloseRow(
  pool: Pool,
  opts: {
    idiw37: number
    wkctr: string
    startD: string
    startT: string
    endD: string
    endT: string
  },
): Promise<number> {
  const d1 = parseDdMmYyyy(opts.startD)
  const d2 = parseDdMmYyyy(opts.endD)
  const t1 = parseHhMm(opts.startT)
  const t2 = parseHhMm(opts.endT)
  if (!d1 || !d2 || !t1 || !t2) throw new Error('Invalid date/time format')

  const cstdate = computeEpochSeconds(d1, t1)
  const cendate = computeEpochSeconds(d2, t2)
  const wktimewk = durationMinutes(cstdate, cendate)
  if (wktimewk <= 0) throw new Error('End time must be after start time')

  const dup = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app.tbwrkclose WHERE idiw37 = $1 AND wkctr = $2`,
    [opts.idiw37, opts.wkctr],
  )
  if (Number(dup.rows[0]?.n ?? 0) > 0) {
    throw new Error('ท่านได้ทำการปิดงานไปแล้ว โปรดตรวจสอบ')
  }

  const wktimeclose = Math.floor(Date.now() / 1000)
  await pool.query(
    `INSERT INTO app.tbwrkclose (idiw37, cstdate, cendate, wkctr, wktimeclose, wktimewk, wkunit)
     VALUES ($1, $2, $3, $4, $5, $6, 'Min')`,
    [opts.idiw37, cstdate, cendate, opts.wkctr, wktimeclose, wktimewk],
  )
  await touchConfirmQcPending(pool, opts.idiw37)
  const { upsertPage2OnPersonnelClose } = await import('./wo-pm-page2.js')
  await upsertPage2OnPersonnelClose(pool, {
    idiw37: opts.idiw37,
    wkctr: opts.wkctr,
    cendate,
  })
  return wktimewk
}

/**
 * ปิดงานย่อผ่าน Telegram — บันทึกเวลา 08:00–ตอนนี้ (วันนี้) โดยไม่บังคับรูป/ความคิดเห็นในแชท
 * ช่างยังต้องเติมรูป/comment บนเว็บก่อน Planner Confirm เต็มรูปแบบ
 */
export async function addPersonnelCloseTelegramMini(
  pool: Pool,
  opts: { idiw37: number; wkctr: string },
): Promise<{ wktimewk: number; startLabel: string; endLabel: string }> {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0)
  const startD = formatDdMmYyyy(dayStart)
  const startT = formatHhMm(dayStart)
  const endD = formatDdMmYyyy(now)
  const endT = formatHhMm(now)

  const wktimewk = await insertPersonnelCloseRow(pool, {
    idiw37: opts.idiw37,
    wkctr: opts.wkctr,
    startD,
    startT,
    endD,
    endT,
  })

  return {
    wktimewk,
    startLabel: `${startD} ${startT}`,
    endLabel: `${endD} ${endT}`,
  }
}

export async function addPersonnelClose(
  pool: Pool,
  opts: {
    idiw37: number
    wkctr: string
    startD: string
    startT: string
    endD: string
    endT: string
  },
): Promise<void> {
  const { assertWorkOrderCloseReady } = await import('../lib/work-order-close-guard.js')
  await assertWorkOrderCloseReady(pool, opts.idiw37)
  await insertPersonnelCloseRow(pool, opts)
}

export async function deletePersonnelClose(pool: Pool, idwrkclose: number): Promise<void> {
  await pool.query(`DELETE FROM app.tbwrkclose WHERE idwrkclose = $1`, [idwrkclose])
}
