import type { Pool } from 'pg'
import { FACTORY_CODE, sqlFactoryScope } from '../services/scheduling-shared.js'
import { resolveCalendarWorkHours } from './calendar-event-display.js'
import { manhourSummaryW } from './manhour-minutes.js'
import { prorateManhourHoursToDay } from './manhour-day-prorate.js'

export type PlanningAvailableHoursRow = {
  wkctr: string
  /** ชม. HR จาก tbmanhours (wh+OT) ที่ทับวันที่เลือก */
  hrHours: number
  /** ชม.แผนจาก WO ที่จ่ายให้ช่างในวันนั้น (work จาก tbiw37n) */
  plannedHours: number
  /** ชม.ว่าง = HR − แผน (ไม่ต่ำกว่า 0) */
  availableHours: number
  hasManhour: boolean
}

const MANHOUR_DAY_OVERLAP_SQL = 'm.stworkday <= $2 AND m.workday >= $1'

function parseIsoDayRange(isoDate: string): { dayStart: number; dayEnd: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
  const dayStart = Math.floor(new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime() / 1000)
  if (dayStart <= 0) return null
  return { dayStart, dayEnd: dayStart + 86400 }
}

function roundHours(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Available hour ต่อช่างในวันที่วางแผน — HR (tbmanhours แบ่ง prorate ตามวัน) − ชม.แผนที่จ่ายแล้ว
 * เทียบสไลด์ลูกค้า §4.1 Planning tab
 */
export async function loadPlanningAvailableHoursByWkctr(
  pool: Pool,
  isoDate: string,
  opts: { excludeIdiw37?: number } = {},
): Promise<Map<string, PlanningAvailableHoursRow>> {
  const range = parseIsoDayRange(isoDate)
  const out = new Map<string, PlanningAvailableHoursRow>()
  if (!range) return out

  const { dayStart, dayEnd } = range
  const factory = `%${FACTORY_CODE}%`

  const [hrRes, plannedRes] = await Promise.all([
    pool.query<{
      wkctr: string
      stworkday: string
      workday: string
      wh: string
      ot1: string
      ot15: string
      ot1hol: string
      ot2: string
      ot3: string
    }>(
      `SELECT wc.wkctr,
              m.stworkday::text AS stworkday,
              m.workday::text AS workday,
              m.wh::text AS wh,
              m.ot1::text AS ot1,
              m.ot15::text AS ot15,
              m.ot1hol::text AS ot1hol,
              m.ot2::text AS ot2,
              m.ot3::text AS ot3
       FROM app.tbmanhours m
       INNER JOIN app.tbworkcenter wc ON wc.idwkctr = m.idwkctr
       WHERE ${MANHOUR_DAY_OVERLAP_SQL}`,
      [dayStart, dayEnd],
    ),
    pool.query<{
      wkctr: string
      work: string | null
      untime: string | null
    }>(
      `SELECT mp.wkctr,
              i.work::text AS work,
              i.untime::text AS untime
       FROM app.tbplangingwork mp
       INNER JOIN app.tbiw37n i ON i.idiw37 = mp.idiw37
       LEFT JOIN app.view_order v ON v.idiw37 = i.idiw37
       WHERE mp.wkctr IS NOT NULL
         AND TRIM(mp.wkctr) <> ''
         AND COALESCE(TRIM(mp.pwteam), '') <> 'G'
         AND ${sqlFactoryScope('i', '$3')}
         AND (
           (v.cday IS NOT NULL AND v.cday::bigint >= $1 AND v.cday::bigint < $2)
           OR (
             (v.cday IS NULL OR v.cday::bigint <= 0)
             AND i.actfinish IS NOT NULL AND i.actfinish::bigint >= $1 AND i.actfinish::bigint < $2
           )
           OR (
             (v.cday IS NULL OR v.cday::bigint <= 0)
             AND (i.actfinish IS NULL OR i.actfinish::bigint <= 0)
             AND i.bscstart IS NOT NULL AND i.bscstart::bigint >= $1 AND i.bscstart::bigint < $2
           )
         )
         ${opts.excludeIdiw37 != null ? 'AND mp.idiw37 <> $4' : ''}`,
      opts.excludeIdiw37 != null
        ? [dayStart, dayEnd, factory, opts.excludeIdiw37]
        : [dayStart, dayEnd, factory],
    ),
  ])

  const hrByWkctr = new Map<string, number>()
  for (const row of hrRes.rows) {
    const wkctr = row.wkctr?.trim()
    if (!wkctr) continue
    const stworkday = Number(row.stworkday)
    const workday = Number(row.workday)
    if (!Number.isFinite(stworkday) || !Number.isFinite(workday)) continue
    const rowTotal = manhourSummaryW({
      wh: Number(row.wh),
      ot1: Number(row.ot1),
      ot15: Number(row.ot15),
      ot1hol: Number(row.ot1hol),
      ot2: Number(row.ot2),
      ot3: Number(row.ot3),
    })
    const slice = prorateManhourHoursToDay(rowTotal, stworkday, workday, dayStart, dayEnd)
    if (slice <= 0) continue
    hrByWkctr.set(wkctr, roundHours((hrByWkctr.get(wkctr) ?? 0) + slice))
  }

  for (const [wkctr, hrHours] of hrByWkctr) {
    out.set(wkctr, {
      wkctr,
      hrHours,
      plannedHours: 0,
      availableHours: hrHours,
      hasManhour: hrHours > 0,
    })
  }

  const plannedByWkctr = new Map<string, number>()
  for (const row of plannedRes.rows) {
    const wkctr = row.wkctr?.trim()
    if (!wkctr) continue
    const h = resolveCalendarWorkHours(row.work, row.untime)
    if (h <= 0) continue
    plannedByWkctr.set(wkctr, roundHours((plannedByWkctr.get(wkctr) ?? 0) + h))
  }

  for (const [wkctr, plannedHours] of plannedByWkctr) {
    const existing = out.get(wkctr)
    if (existing) {
      existing.plannedHours = plannedHours
      existing.availableHours = roundHours(Math.max(0, existing.hrHours - plannedHours))
    } else {
      out.set(wkctr, {
        wkctr,
        hrHours: 0,
        plannedHours,
        availableHours: 0,
        hasManhour: false,
      })
    }
  }

  return out
}

export function mergeWorkcenterAvailableHours<T extends { wkctr: string }>(
  workcenters: T[],
  hoursMap: Map<string, PlanningAvailableHoursRow>,
): (T & {
  hrHours: number | null
  plannedHours: number | null
  availableHours: number | null
})[] {
  return workcenters.map((w) => {
    const row = hoursMap.get(w.wkctr.trim())
    if (!row) {
      return { ...w, hrHours: null, plannedHours: null, availableHours: null }
    }
    return {
      ...w,
      hrHours: row.hasManhour ? row.hrHours : null,
      plannedHours: row.plannedHours > 0 ? row.plannedHours : row.plannedHours === 0 ? 0 : null,
      availableHours: row.hasManhour
        ? row.availableHours
        : row.plannedHours > 0
          ? 0
          : null,
    }
  })
}
