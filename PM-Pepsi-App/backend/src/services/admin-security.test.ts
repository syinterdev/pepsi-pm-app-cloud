import { describe, expect, it, vi } from 'vitest'
import { getFailedLoginByDay, listRbacDenials } from './admin-security.js'

describe('getFailedLoginByDay', () => {
  it('fills missing days with zero', async () => {
    const yesterday = new Date()
    yesterday.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ day: yesterday, count: '2' }],
      }),
    }

    const result = await getFailedLoginByDay(pool as never, 3)
    expect(result.series).toHaveLength(3)
    expect(result.total).toBe(2)
    expect(result.series.some((p) => p.count === 2)).toBe(true)
    expect(result.series.some((p) => p.count === 0)).toBe(true)
  })
})

describe('listRbacDenials', () => {
  it('queries only rbac.deny action', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] }),
    }

    await listRbacDenials(pool as never, 10, 0)
    const sql = String(pool.query.mock.calls[1]?.[0] ?? '')
    expect(sql).toContain("action = 'rbac.deny'")
  })
})
