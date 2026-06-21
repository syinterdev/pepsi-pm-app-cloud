import type { Pool, PoolClient } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { patchMasterPlanRow } from './master-plan.js'

function mockRequest() {
  return {
    authUser: { idwkctr: 'WC001', username: 'wc001', userst: 'A' },
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as never
}

describe('patchMasterPlanRow', () => {
  it('updates cells and records changelog entries', async () => {
    const queries: string[] = []
    const client = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        queries.push(String(sql))
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] }
        if (sql.includes('FOR UPDATE')) {
          return {
            rows: [
              {
                row_id: 42,
                sheet_id: 7,
                row_index: 10,
                cells_json: { Min: '30', 'PM list': 'Check' },
                sheet_kind: 'detail',
                column_headers_json: ['Zone', 'PM list', 'Min'],
                sheet_name: 'STAX',
                discipline: 'EE',
                status: 'published',
              },
            ],
          }
        }
        if (sql.includes('UPDATE app.tb_master_plan_row')) return { rows: [] }
        if (sql.includes('INSERT INTO app.tb_master_plan_change')) return { rows: [] }
        if (sql.includes('INSERT INTO app.tbl_audit_log')) return { rows: [{ id: '1' }] }
        return { rows: [] }
      }),
      release: vi.fn(),
    } as unknown as PoolClient

    const pool = {
      connect: vi.fn(async () => client),
      query: vi.fn(async (sql: string) => {
        if (String(sql).includes('tbl_audit_log')) return { rows: [{ id: '1' }] }
        return { rows: [] }
      }),
    } as unknown as Pool

    const result = await patchMasterPlanRow(
      pool,
      42,
      { cells: { Min: '45' }, comment: 'adjust min' },
      'WC001',
      mockRequest(),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.changedFields).toEqual(['Min'])
      expect(result.cells.Min).toBe('45')
    }
    expect(queries.some((q) => q.includes('INSERT INTO app.tb_master_plan_change'))).toBe(true)
    expect(queries.some((q) => q.includes('UPDATE app.tb_master_plan_row'))).toBe(true)
  })

  it('returns 403 for read-only summary sheet', async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] }
        if (sql.includes('FOR UPDATE')) {
          return {
            rows: [
              {
                row_id: 1,
                sheet_id: 2,
                row_index: 0,
                cells_json: { col0: 'A' },
                sheet_kind: 'summary',
                column_headers_json: [],
                sheet_name: 'Total Master plan',
                discipline: 'EE',
                status: 'published',
              },
            ],
          }
        }
        return { rows: [] }
      }),
      release: vi.fn(),
    } as unknown as PoolClient

    const pool = {
      connect: vi.fn(async () => client),
    } as unknown as Pool

    const result = await patchMasterPlanRow(pool, 1, { cells: { col0: 'B' } }, 'WC001', mockRequest())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.code).toBe('SHEET_READ_ONLY')
    }
  })
})
