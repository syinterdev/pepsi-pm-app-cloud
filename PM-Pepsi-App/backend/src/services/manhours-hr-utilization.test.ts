import { describe, expect, it } from 'vitest'
import { safeRatio } from '../lib/reports-range.js'

describe('manhours-hr-utilization formula', () => {
  it('matches M_manhour_chart_performance: confirm / summaryW * 100', () => {
    expect(safeRatio(40, 80)).toBe(50)
    expect(safeRatio(0, 80)).toBe(0)
    expect(safeRatio(10, 0)).toBe(0)
  })
})
