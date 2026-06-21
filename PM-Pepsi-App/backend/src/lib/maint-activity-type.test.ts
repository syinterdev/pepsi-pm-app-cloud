import { describe, expect, it } from 'vitest'
import {
  expandMaintActivityMatCodes,
  listMaintActivityTypeFilterOptions,
  lookupMaintActivityType,
} from './maint-activity-type.js'

describe('maint-activity-type', () => {
  it('lists 19 MaintActivityType ZB02 options', () => {
    const opts = listMaintActivityTypeFilterOptions()
    expect(opts).toHaveLength(19)
    expect(opts[0]).toEqual({
      code: '001',
      label: '001 = Inspection & Cond. Monitoring',
    })
    expect(opts[1]).toEqual({
      code: '002',
      label: '002 = Preventive Maintenance',
    })
  })

  it('expands mat codes for SQL IN', () => {
    expect(expandMaintActivityMatCodes(['002'])).toEqual(
      expect.arrayContaining(['002', '2', '02']),
    )
  })

  it('looks up padded mat', () => {
    expect(lookupMaintActivityType('2')?.description).toBe('Preventive Maintenance')
  })
})
