import { describe, expect, it } from 'vitest'
import { assignWorkOrderPlanningBatch } from './work-orders.js'

type QueryCall = {
  text: string
  params?: unknown[]
}

function createPoolMock() {
  const calls: QueryCall[] = []
  const inserted: string[][] = []

  return {
    calls,
    inserted,
    pool: {
      async query(text: string, params?: unknown[]) {
        calls.push({ text, params })

        if (text.includes('FROM app.tbiw37n i') && text.includes('JOIN app.view_order')) {
          return { rows: [{ idiw37: 777, wkorder: '400001' }], rowCount: 1 }
        }

        if (text.includes('FROM app.tbworkcenter') && text.includes('wkctr = ANY')) {
          return {
            rows: [
              { wkctr: 'PAC001' },
              { wkctr: 'PAC002' },
              { wkctr: 'PAC003' },
            ],
            rowCount: 3,
          }
        }

        if (text.includes('FROM app.tbplangingwork') && text.includes('wkctr = ANY')) {
          return { rows: [{ wkctr: 'PAC002' }], rowCount: 1 }
        }

        if (text.includes('INSERT INTO app.tbplangingwork')) {
          inserted.push((params?.[3] as string[]) ?? [])
          return { rows: [], rowCount: inserted[inserted.length - 1].length }
        }

        throw new Error(`Unexpected query: ${text}`)
      },
    },
  }
}

describe('assignWorkOrderPlanningBatch', () => {
  it('dedupes input, skips already assigned users, reports notFound, and inserts remaining users once', async () => {
    const mock = createPoolMock()

    const result = await assignWorkOrderPlanningBatch(
      mock.pool as never,
      '400001',
      ['PAC001', 'PAC002', 'PAC001', 'PAC404', '', 'PAC003'],
      'Batch assign',
      'ADMIN01',
    )

    expect(result).toEqual({
      assigned: ['PAC001', 'PAC003'],
      skipped: ['PAC002'],
      notFound: ['PAC404'],
    })
    expect(mock.inserted).toEqual([['PAC001', 'PAC003']])
    expect(mock.calls.some((c) => c.text.includes('ON CONFLICT (idiw37, wkctr) DO NOTHING'))).toBe(true)
  })

  it('returns null when work order is not found', async () => {
    const pool = {
      async query() {
        return { rows: [], rowCount: 0 }
      },
    }

    await expect(
      assignWorkOrderPlanningBatch(pool as never, 'missing', ['PAC001'], undefined, 'ADMIN01'),
    ).resolves.toBeNull()
  })
})
