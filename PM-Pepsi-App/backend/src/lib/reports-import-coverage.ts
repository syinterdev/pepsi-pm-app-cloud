import type { Pool } from 'pg'
import type { ReportsDateRange } from './reports-range.js'

export type ReportsImportCoverage = {
  /** จำนวนแถว IW37N ที่มี wkctr + bscstart (หลัง import SAP) */
  iw37nCount: number
  /** ช่วง bscstart ใน DB (ISO yyyy-mm-dd) */
  iw37nBscstartFrom: string | null
  iw37nBscstartTo: string | null
  manhourCount: number
  manhourWorkdayFrom: string | null
  manhourWorkdayTo: string | null
  /** WO / confirm ในช่วงที่ผู้ใช้เลือก */
  workOrdersInRange: number
  confirmationsInRange: number
  /** ช่วงที่แนะนำให้เลือกเมื่อข้อมูล SAP อยู่นอกช่วงปัจจุบัน */
  suggestedSapRange: { from: string; to: string } | null
  /** true ถ้าช่วงที่เลือกทับกับข้อมูล IW37N ใน DB */
  rangeOverlapsSap: boolean
}

function unixToIsoDate(sec: number | null | undefined): string | null {
  if (sec == null || !Number.isFinite(sec)) return null
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rangesOverlap(
  selFrom: number,
  selTo: number,
  sapMin: number | null,
  sapMax: number | null,
): boolean {
  if (sapMin == null || sapMax == null) return false
  return selFrom <= sapMax && selTo >= sapMin
}

/** สรุปขอบเขตข้อมูล SAP/manhour ใน DB — ใช้ช่วยรายงานสัปดาห์หลัง import */
export async function getReportsImportCoverage(
  pool: Pool,
  range: ReportsDateRange,
): Promise<ReportsImportCoverage> {
  const [iwRes, mhRes, inRangeRes] = await Promise.all([
    pool.query<{ cnt: string; min_bsc: number | null; max_bsc: number | null }>(
      `SELECT
         COUNT(*)::text AS cnt,
         MIN(bscstart) AS min_bsc,
         MAX(bscstart) AS max_bsc
       FROM app.tbiw37n
       WHERE wkctr IS NOT NULL AND TRIM(wkctr) <> ''
         AND bscstart IS NOT NULL`,
    ),
    pool.query<{ cnt: string; min_wd: number | null; max_wd: number | null }>(
      `SELECT
         COUNT(*)::text AS cnt,
         MIN(workday) AS min_wd,
         MAX(workday) AS max_wd
       FROM app.tbmanhours`,
    ),
    pool.query<{ wo: string; conf: string }>(
      `SELECT
         (SELECT COUNT(DISTINCT idiw37)::text FROM app.view_order
          WHERE bscstart IS NOT NULL AND bscstart >= $1 AND bscstart <= $2) AS wo,
         (SELECT COUNT(*)::text FROM app.view_confirmation
          WHERE endate >= $1 AND endate <= $2) AS conf`,
      [range.from, range.to],
    ),
  ])

  const iw37nCount = Number(iwRes.rows[0]?.cnt ?? 0)
  const minBsc = iwRes.rows[0]?.min_bsc ?? null
  const maxBsc = iwRes.rows[0]?.max_bsc ?? null
  const iw37nBscstartFrom = unixToIsoDate(minBsc)
  const iw37nBscstartTo = unixToIsoDate(maxBsc)

  const suggestedSapRange =
    iw37nBscstartFrom && iw37nBscstartTo
      ? { from: iw37nBscstartFrom, to: iw37nBscstartTo }
      : null

  return {
    iw37nCount,
    iw37nBscstartFrom,
    iw37nBscstartTo,
    manhourCount: Number(mhRes.rows[0]?.cnt ?? 0),
    manhourWorkdayFrom: unixToIsoDate(mhRes.rows[0]?.min_wd ?? null),
    manhourWorkdayTo: unixToIsoDate(mhRes.rows[0]?.max_wd ?? null),
    workOrdersInRange: Number(inRangeRes.rows[0]?.wo ?? 0),
    confirmationsInRange: Number(inRangeRes.rows[0]?.conf ?? 0),
    suggestedSapRange,
    rangeOverlapsSap: rangesOverlap(range.from, range.to, minBsc, maxBsc),
  }
}
