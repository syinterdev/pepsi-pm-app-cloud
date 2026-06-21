import type { Pool } from 'pg'
import { FACTORY_CODE, sqlFactoryScope } from './scheduling-shared.js'

export type AuditHubPlanWoSnapshot = {
  year: number
  month: number
  monthLabel: string
  totalWo: number
  pmWo: number
  reactiveWo: number
  openWo: number
  assignedWo: number
  movedWo: number
}

function currentMonthBounds(): { year: number; month: number; fromSec: number; toSec: number } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const fromSec = Math.floor(new Date(year, month - 1, 1).getTime() / 1000)
  const toSec = Math.floor(new Date(year, month, 1).getTime() / 1000)
  return { year, month, fromSec, toSec }
}

const TH_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const

export async function getAuditHubPlanWoSnapshot(pool: Pool): Promise<AuditHubPlanWoSnapshot> {
  const { year, month, fromSec, toSec } = currentMonthBounds()
  const factory = `%${FACTORY_CODE}%`

  try {
    const r = await pool.query<{
      total_wo: string
      pm_wo: string
      reactive_wo: string
      open_wo: string
      assigned_wo: string
      moved_wo: string
    }>(
      `SELECT
         COUNT(*)::text AS total_wo,
         COUNT(*) FILTER (WHERE TRIM(i.wktype) = 'ZB02')::text AS pm_wo,
         COUNT(*) FILTER (WHERE TRIM(i.wktype) IN ('ZB01', 'ZB05'))::text AS reactive_wo,
         COUNT(*) FILTER (WHERE TRIM(i.syst) IN ('CRTD', 'REL'))::text AS open_wo,
         COUNT(*) FILTER (
           WHERE EXISTS (SELECT 1 FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37)
         )::text AS assigned_wo,
         COUNT(*) FILTER (
           WHERE EXISTS (SELECT 1 FROM app.tbmoveplan mp WHERE mp.idiw37 = i.idiw37)
         )::text AS moved_wo
       FROM app.tbiw37n i
       WHERE ${sqlFactoryScope('i', '$1')}
         AND i.bscstart IS NOT NULL
         AND i.bscstart >= $2
         AND i.bscstart < $3`,
      [factory, fromSec, toSec],
    )
    const row = r.rows[0]
    return {
      year,
      month,
      monthLabel: `${TH_MONTHS[month - 1]} ${year + 543}`,
      totalWo: Number(row?.total_wo ?? 0),
      pmWo: Number(row?.pm_wo ?? 0),
      reactiveWo: Number(row?.reactive_wo ?? 0),
      openWo: Number(row?.open_wo ?? 0),
      assignedWo: Number(row?.assigned_wo ?? 0),
      movedWo: Number(row?.moved_wo ?? 0),
    }
  } catch {
    return {
      year,
      month,
      monthLabel: `${TH_MONTHS[month - 1]} ${year + 543}`,
      totalWo: 0,
      pmWo: 0,
      reactiveWo: 0,
      openWo: 0,
      assignedWo: 0,
      movedWo: 0,
    }
  }
}
