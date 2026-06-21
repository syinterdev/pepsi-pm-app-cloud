import type { Pool } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { clearPermissionCache } from '../lib/has-permission.js'
import { authBearer, legacyRbacPool, TEST_SESSION_SECRET } from '../test/admin-api-harness.js'

const mockPatchMasterPlanRow = vi.fn()

vi.mock('../services/master-plan.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/master-plan.js')>()
  return {
    ...actual,
    patchMasterPlanRow: (...args: unknown[]) => mockPatchMasterPlanRow(...args),
  }
})

function buildApp(pool: Pool) {
  return createApp({
    pool,
    sessionSecret: TEST_SESSION_SECRET,
    databaseUrl: 'postgresql://localhost:5432/pm_test',
  })
}

describe('master-plan API (supertest)', () => {
  let pool: Pool
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    clearPermissionCache()
    pool = legacyRbacPool()
    app = buildApp(pool)
    mockPatchMasterPlanRow.mockReset()
  })

  it('PATCH /rows/:rowId returns 403 without master-data.write', async () => {
    const res = await request(app)
      .patch('/api/v1/master-plan/rows/1')
      .set('Authorization', authBearer('U'))
      .send({ cells: { Min: '45' } })

    expect(res.status).toBe(403)
    expect(mockPatchMasterPlanRow).not.toHaveBeenCalled()
  })

  it('PATCH /rows/:rowId returns 200 with master-data.write (role A)', async () => {
    mockPatchMasterPlanRow.mockResolvedValue({
      ok: true,
      rowId: 1,
      sheetId: 7,
      cells: { Min: '45' },
      changedFields: ['Min'],
    })

    const res = await request(app)
      .patch('/api/v1/master-plan/rows/1')
      .set('Authorization', authBearer('A'))
      .send({ cells: { Min: '45' } })

    expect(res.status).toBe(200)
    expect(res.body.changedFields).toEqual(['Min'])
    expect(mockPatchMasterPlanRow).toHaveBeenCalledOnce()
  })
})
