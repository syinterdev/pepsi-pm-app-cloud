import { describe, expect, it } from 'vitest'
import {
  excelStylePercentTotal,
  formatEngUtilizationHrHour,
  formatEngUtilizationLabel,
  resolveEngUtilizationDateRange,
  toEngUtilizationChartRows,
} from './eng-utilization-chart'

describe('eng-utilization-chart', () => {
  it('formats label like Excel', () => {
    expect(formatEngUtilizationLabel('PAC010', 'Narit S')).toBe('PAC010 (Narit)')
  })

  it('excel total is PM + Reactive only', () => {
    expect(excelStylePercentTotal(29.36, 53.97)).toBe(83.33)
  })

  it('resolves daily / weekly / monthly / yearly ranges', () => {
    const ref = new Date(2026, 4, 15) // 2026-05-15
    expect(resolveEngUtilizationDateRange('daily', ref)).toEqual({
      from: '2026-05-14',
      to: '2026-05-14',
    })
    expect(resolveEngUtilizationDateRange('weekly', ref)).toEqual({
      from: '2026-05-09',
      to: '2026-05-15',
    })
    expect(resolveEngUtilizationDateRange('monthly', ref)).toEqual({
      from: '2026-05-01',
      to: '2026-05-15',
    })
    expect(resolveEngUtilizationDateRange('yearly', ref)).toEqual({
      from: '2025-01-01',
      to: '2025-12-31',
    })
  })

  it('maps API rows for chart', () => {
    const rows = toEngUtilizationChartRows([
      {
        wkctr: 'PAC010',
        idwkctr: '1',
        displayName: 'Narit',
        hasImage: true,
        pmWork: 0,
        pmUnit: 'H',
        reactiveWork: 0,
        reactiveUnit: 'H',
        rcaWork: 4,
        rcaUnit: 'Hr',
        woCount: 0,
        pmHours: 18.5,
        reactiveHours: 34,
        hrHour: 63,
        otHour: 0,
        percentPm: 29.37,
        percentReactive: 53.97,
        percentRca: 6.35,
        percentTotal: 89.69,
      },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.percentTotalExcel).toBeCloseTo(83.34, 1)
    expect(rows[0]?.hrHour).toBe(63)
    expect(rows[0]?.woCount).toBe(0)
  })

  it('formats HR hours for display', () => {
    expect(formatEngUtilizationHrHour(63)).toBe('63')
    expect(formatEngUtilizationHrHour(40.5)).toBe('40.5')
  })
})
