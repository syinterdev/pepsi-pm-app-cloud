import { describe, expect, it } from 'vitest'
import { reportsKpiResponseSchema, summaryWeeklyResponseSchema } from './reports.js'

describe('reports schemas', () => {
  it('parses KPI trend response', () => {
    const parsed = reportsKpiResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' },
      labels: ['2026-W18', '2026-W19'],
      utilization: [80, 75],
      backlogHours: [120, 95],
      weekToWeek: [
        {
          weekLabel: '2026-W19',
          prevWeekLabel: '2026-W18',
          utilization: 75,
          utilizationPrev: 80,
          utilizationDelta: -5,
          backlogHours: 95,
          backlogHoursPrev: 120,
          backlogDelta: -25,
        },
      ],
    })
    expect(parsed.utilization).toHaveLength(2)
  })

  it('parses summary weekly table + chart', () => {
    const parsed = summaryWeeklyResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' },
      utilizationChart: [{ idwkctr: 'HR001', wkctr: 'PAC001', summaryHours: 40 }],
      importCoverage: {
        iw37nCount: 100,
        iw37nBscstartFrom: '2020-05-01',
        iw37nBscstartTo: '2020-06-30',
        manhourCount: 50,
        manhourWorkdayFrom: '2020-05-01',
        manhourWorkdayTo: '2020-06-01',
        workOrdersInRange: 12,
        confirmationsInRange: 3,
        suggestedSapRange: { from: '2020-05-01', to: '2020-06-30' },
        rangeOverlapsSap: true,
      },
      rows: [
        {
          wkctr: 'PAC001',
          idwkctr: 'HR001',
          displayName: 'A',
          hasImage: true,
          pmWork: 10,
          pmUnit: 'H',
          reactiveWork: 5,
          reactiveUnit: 'Min',
          rcaWork: 8,
          rcaUnit: 'Hr',
          woCount: 3,
          pmHours: 10,
          reactiveHours: 5,
          hrHour: 40,
          otHour: 5,
          percentPm: 25,
          percentReactive: 12.5,
          percentRca: 20,
          percentTotal: 57.5,
        },
      ],
    })
    expect(parsed.rows[0]?.percentTotal).toBe(57.5)
  })
})
