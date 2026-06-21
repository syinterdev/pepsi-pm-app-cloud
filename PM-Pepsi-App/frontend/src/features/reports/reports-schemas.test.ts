import { describe, expect, it } from 'vitest'
import { kpiResponseSchema, summaryWeeklyResponseSchema } from '@/api/schemas'

const range = { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' }

describe('reports frontend schemas', () => {
  it('parses kpi and summary-weekly API contracts', () => {
    const kpi = kpiResponseSchema.parse({
      range,
      labels: ['2026-W01', '2026-W02'],
      utilization: [50, 55],
      backlogHours: [10, 12],
      weekToWeek: [
        {
          weekLabel: '2026-W02',
          prevWeekLabel: '2026-W01',
          utilization: 55,
          utilizationPrev: 50,
          utilizationDelta: 5,
          backlogHours: 12,
          backlogHoursPrev: 10,
          backlogDelta: 2,
        },
      ],
    })
    expect(kpi.labels[0]).toBe('2026-W01')
    expect(kpi.range.fromDate).toBe('2026-04-01')

    const weekly = summaryWeeklyResponseSchema.parse({
      range,
      utilizationChart: [],
      rows: [],
      importCoverage: {
        iw37nCount: 0,
        iw37nBscstartFrom: null,
        iw37nBscstartTo: null,
        manhourCount: 0,
        manhourWorkdayFrom: null,
        manhourWorkdayTo: null,
        workOrdersInRange: 0,
        confirmationsInRange: 0,
        suggestedSapRange: null,
        rangeOverlapsSap: false,
      },
    })
    expect(weekly.rows).toEqual([])
  })
})
