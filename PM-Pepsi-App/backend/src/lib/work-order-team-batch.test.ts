import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { createPool } from '../db/pool.js'
import {
  updateWorkOrderTeam,
  updateWorkOrderTeamBatch,
} from '../services/work-orders.js'
import { workOrderTeamBulkBodySchema } from '../schemas/work-orders.js'

describe('workOrderTeamBulkBodySchema', () => {
  it('accepts up to 100 ids', () => {
    const ids = Array.from({ length: 100 }, (_, i) => String(i + 1))
    const parsed = workOrderTeamBulkBodySchema.safeParse({ ids, team: 'A' })
    expect(parsed.success).toBe(true)
  })

  it('rejects more than 100 ids', () => {
    const ids = Array.from({ length: 101 }, (_, i) => String(i + 1))
    const parsed = workOrderTeamBulkBodySchema.safeParse({ ids, team: 'B' })
    expect(parsed.success).toBe(false)
  })

  it('accepts EE and UT', () => {
    expect(workOrderTeamBulkBodySchema.safeParse({ ids: ['1'], team: 'EE' }).success).toBe(true)
    expect(workOrderTeamBulkBodySchema.safeParse({ ids: ['1'], team: 'UT' }).success).toBe(true)
  })

  it('rejects legacy team P', () => {
    expect(workOrderTeamBulkBodySchema.safeParse({ ids: ['1'], team: 'P' }).success).toBe(false)
  })
})

const databaseUrl = process.env.DATABASE_URL?.trim()
const describeIfDb = databaseUrl ? describe : describe.skip

describeIfDb('updateWorkOrderTeamBatch', () => {
  const pool = createPool(databaseUrl!)

  it('updates multiple rows in one call', async () => {
    const sample = await pool.query<{ idiw37: string }>(
      `SELECT idiw37::text FROM app.tbiw37n
       WHERE functionalloc ILIKE '%7151%'
       ORDER BY idiw37
       LIMIT 3`,
    )
    if (sample.rows.length < 2) return

    const ids = sample.rows.map((r) => r.idiw37)
    const result = await updateWorkOrderTeamBatch(pool, ids, 'B')
    expect(result.updated.length).toBe(ids.length)
    expect(result.notFound).toEqual([])
    expect(result.team).toBe('B')

    for (const id of ids) {
      const ok = await updateWorkOrderTeam(pool, id, '')
      expect(ok).toBe(true)
    }
  })
})
