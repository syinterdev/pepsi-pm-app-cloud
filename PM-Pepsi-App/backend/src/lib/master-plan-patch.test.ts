import { describe, expect, it } from 'vitest'
import { validateMasterPlanCellPatch } from './master-plan-patch.js'

describe('validateMasterPlanCellPatch', () => {
  const headers = ['Zone', 'PM list', 'Min']

  it('rejects summary sheets', () => {
    const result = validateMasterPlanCellPatch('summary', [], {}, { col0: 'x' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('SHEET_READ_ONLY')
  })

  it('rejects unknown columns', () => {
    const result = validateMasterPlanCellPatch('detail', headers, { Min: '30' }, { Unknown: '1' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_FIELD')
  })

  it('accepts partial cell updates', () => {
    const result = validateMasterPlanCellPatch(
      'detail',
      headers,
      { Zone: 'SE0', 'PM list': 'Check', Min: '30' },
      { Min: '45', 'PM list': 'Check motor' },
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.changes).toHaveLength(2)
      expect(result.changes.find((c) => c.fieldName === 'Min')).toEqual({
        fieldName: 'Min',
        before: '30',
        after: '45',
      })
    }
  })
})
