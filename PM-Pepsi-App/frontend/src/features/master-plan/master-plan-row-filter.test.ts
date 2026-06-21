import { describe, expect, it } from 'vitest'
import { filterMasterPlanRows } from './master-plan-row-filter'

describe('filterMasterPlanRows', () => {
  const rows = [
    {
      id: 1,
      cells: { 'Maintenance plan': '342596', 'M/C': 'SSN Dust Collector' },
      display: { 'Maintenance plan': '342596', 'M/C': 'SSN Dust Collector' },
    },
    {
      id: 2,
      cells: { 'Maintenance plan': '610000004061', 'M/C': 'Main Oil Pump' },
      display: { 'Maintenance plan': '610000004061', 'M/C': 'Main Oil Pump' },
    },
  ]

  it('returns all rows when query empty', () => {
    expect(filterMasterPlanRows(rows, '')).toHaveLength(2)
  })

  it('finds mntplan 342596', () => {
    expect(filterMasterPlanRows(rows, '342596')).toHaveLength(1)
  })
})
