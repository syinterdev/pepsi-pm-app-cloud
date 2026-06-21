import { describe, expect, it } from 'vitest'
import { bulkTeamAuditFields, massConfirmAuditFields } from './audit-bulk-payload.js'

describe('bulkTeamAuditFields', () => {
  it('builds before/after with per-WO team changes', () => {
    const fields = bulkTeamAuditFields({
      team: 'A',
      updated: ['101', '102'],
      notFound: ['999'],
      changes: [
        { id: '101', from: null, to: 'A' },
        { id: '102', from: 'B', to: 'A' },
      ],
    })
    expect(fields.resourceId).toBe('101')
    expect(fields.message).toContain('Bulk team')
    expect(fields.before.changes).toHaveLength(2)
    expect(fields.after.updatedCount).toBe(2)
    expect(fields.after.updatedIds).toEqual(['101', '102'])
    expect(fields.after.notFound).toEqual(['999'])
  })

  it('uses batch resourceId when nothing updated', () => {
    const fields = bulkTeamAuditFields({
      team: 'B',
      updated: [],
      notFound: ['1'],
      changes: [],
    })
    expect(fields.resourceId).toBe('batch')
  })
})

describe('massConfirmAuditFields', () => {
  it('records request in before and outcome in after', () => {
    const body = {
      idiw37n: [1, 2, 3],
      wkctr: 'PAC007',
      startD: '21.05.2026',
      startT: '08:00',
      endD: '21.05.2026',
      endT: '09:00',
    }
    const fields = massConfirmAuditFields(body, {
      succeeded: [1, 2],
      failed: [{ idiw37: 3, message: 'Work order not found' }],
    })
    expect(fields.before).toEqual(body)
    expect(fields.after.succeededCount).toBe(2)
    expect(fields.after.idiw37n).toEqual([1, 2])
    expect(fields.message).toBe('Mass confirm: 2/3 WO')
    expect(fields.resourceId).toBe('1')
  })
})
