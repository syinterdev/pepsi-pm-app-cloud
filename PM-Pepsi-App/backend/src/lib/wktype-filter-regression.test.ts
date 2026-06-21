import 'dotenv/config'
import { beforeAll, describe, expect, it } from 'vitest'
import { createPool } from '../db/pool.js'
import { listCalendarEventsFiltered } from '../services/calendar.js'
import { FACTORY_CODE } from '../services/scheduling-shared.js'
import { searchWorkOrders } from '../services/work-orders.js'

const databaseUrl = process.env.DATABASE_URL?.trim()
const describeIfDb = databaseUrl ? describe : describe.skip

function unixSecToIsoDate(sec: number): string {
  const d = new Date(sec * 1000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describeIfDb('wktype filter regression (B.2)', () => {
  const pool = createPool(databaseUrl!)

  let fromDate = '2020-05-01'
  let toDate = '2020-06-30'
  let calYear = 2020
  let calMonth = 6
  let hasOrderData = false

  beforeAll(async () => {
    const r = await pool.query<{ min_b: string | null; max_b: string | null }>(
      `SELECT MIN(bscstart)::bigint::text AS min_b, MAX(bscstart)::bigint::text AS max_b
       FROM app.view_order
       WHERE functionalloc LIKE $1
         AND bscstart IS NOT NULL
         AND bscstart > 0`,
      [`%${FACTORY_CODE}%`],
    )
    const minSec = Number(r.rows[0]?.min_b)
    const maxSec = Number(r.rows[0]?.max_b)
    if (!Number.isFinite(minSec) || !Number.isFinite(maxSec) || minSec <= 0 || maxSec <= 0) {
      return
    }
    hasOrderData = true
    fromDate = unixSecToIsoDate(minSec)
    toDate = unixSecToIsoDate(maxSec)
    const maxDate = new Date(maxSec * 1000)
    calYear = maxDate.getUTCFullYear()
    calMonth = maxDate.getUTCMonth() + 1
  }, 30_000)

  const base = () => ({
    activity: [] as string[],
    status: [] as string[],
    wkctr: [] as string[],
    team: [] as string[],
    functionalloc: [] as string[],
    equipment: [] as string[],
    fromDate,
    toDate,
  })

  it('ZB02 filter narrows results but does not zero out when ZB02 data exists', async (ctx) => {
    if (!hasOrderData) ctx.skip()
    const all = await searchWorkOrders(pool, { ...base(), wktype: [] })
    const zb02 = await searchWorkOrders(pool, { ...base(), wktype: ['ZB02'] })
    const zb05 = await searchWorkOrders(pool, { ...base(), wktype: ['ZB05'] })

    expect(all.length).toBeGreaterThan(0)
    if (zb02.length > 0) {
      expect(zb02.length).toBeLessThanOrEqual(all.length)
      expect(zb02.every((r) => r.wktype === 'ZB02')).toBe(true)
    }
    if (zb05.length > 0) {
      expect(zb05.length).toBeLessThanOrEqual(all.length)
    }
    expect(zb02.length + zb05.length).toBeGreaterThan(0)
  }, 60_000)

  it('calendar keeps events when filtering wktype=ZB02 in same month', async (ctx) => {
    if (!hasOrderData) ctx.skip()
    const calAll = await listCalendarEventsFiltered(pool, {
      year: calYear,
      month: calMonth,
      ...base(),
      wktype: [],
    })
    const calZb02 = await listCalendarEventsFiltered(pool, {
      year: calYear,
      month: calMonth,
      ...base(),
      wktype: ['ZB02'],
    })

    expect(calAll.items.length).toBeGreaterThan(0)
    if (calZb02.items.length > 0) {
      expect(calZb02.items.length).toBeLessThanOrEqual(calAll.items.length)
    }
    expect(calZb02.items.length).toBeGreaterThan(0)
  }, 60_000)

  it('empty wktype array does not add IN () clause (same as all types in range)', async (ctx) => {
    if (!hasOrderData) ctx.skip()
    const noType = await searchWorkOrders(pool, { ...base(), wktype: [] })
    const allTypes = await searchWorkOrders(pool, {
      ...base(),
      wktype: ['ZB02', 'ZB05'],
    })
    expect(noType.length).toBeGreaterThanOrEqual(allTypes.length)
  }, 60_000)
})
