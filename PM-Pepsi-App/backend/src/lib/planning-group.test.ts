import { describe, expect, it } from 'vitest'
import { loadWorkcenterCodesForPlanningGroup } from './planning-group.js'

describe('loadWorkcenterCodesForPlanningGroup', () => {
  it('resolves members by wkctrgroup code via tbwkctrgroup id', async () => {
    const pool = {
      async query() {
        return { rows: [{ wkctr: 'PAC001' }, { wkctr: 'PAC002' }] }
      },
    }

    const codes = await loadWorkcenterCodesForPlanningGroup(pool as never, 'EE')
    expect(codes).toEqual(['PAC001', 'PAC002'])
  })

  it('returns empty for blank group code', async () => {
    const pool = { async query() { throw new Error('should not query') } }
    await expect(loadWorkcenterCodesForPlanningGroup(pool as never, '  ')).resolves.toEqual([])
  })
})
