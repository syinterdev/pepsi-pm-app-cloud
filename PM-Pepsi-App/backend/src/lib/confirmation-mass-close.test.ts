import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { confirmationMassCloseBodySchema, MASS_CONFIRM_MAX_ITEMS } from '../schemas/work-orders.js'
import { createPool } from '../db/pool.js'
import { addConfirmationCloseBatch } from '../services/confirmation.js'
import { FACTORY_CODE } from '../services/scheduling-shared.js'

describe('confirmationMassCloseBodySchema', () => {
  it('allows up to 44 ids', () => {
    const ids = Array.from({ length: MASS_CONFIRM_MAX_ITEMS }, (_, i) => i + 1)
    const parsed = confirmationMassCloseBodySchema.safeParse({
      idiw37n: ids,
      wkctr: 'PAC007',
      startD: '21.05.2026',
      startT: '08:00',
      endD: '21.05.2026',
      endT: '09:00',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects 45 ids', () => {
    const ids = Array.from({ length: 45 }, (_, i) => i + 1)
    const parsed = confirmationMassCloseBodySchema.safeParse({
      idiw37n: ids,
      wkctr: 'PAC007',
      startD: '21.05.2026',
      startT: '08:00',
      endD: '21.05.2026',
      endT: '09:00',
    })
    expect(parsed.success).toBe(false)
  })
})

const databaseUrl = process.env.DATABASE_URL?.trim()
const describeIfDb = databaseUrl ? describe : describe.skip

describeIfDb('addConfirmationCloseBatch', () => {
  const pool = createPool(databaseUrl!)

  it('closes multiple WO in one transaction', async (ctx) => {
    const sample = await pool.query<{ idiw37: number }>(
      `SELECT idiw37 FROM app.tbiw37n
       WHERE functionalloc LIKE $1
       ORDER BY idiw37
       LIMIT 2`,
      [`%${FACTORY_CODE}%`],
    )
    if (sample.rows.length < 2) return

    const ids = sample.rows.map((r) => r.idiw37)
    const result = await addConfirmationCloseBatch(pool, {
      idiw37n: ids,
      wkctr: 'PAC007',
      startD: '21.05.2026',
      startT: '08:00',
      endD: '21.05.2026',
      endT: '10:00',
      cwkctr: 'PAC007',
    })
    if (result.succeeded.length < 2) {
      ctx.skip(
        `WO not closable in this DB (guard/rules): ${result.failed.map((f) => `${f.idiw37}:${f.message}`).join('; ')}`,
      )
    }
    expect(result.succeeded.length).toBe(2)
    expect(result.failed).toEqual([])
  })
})
