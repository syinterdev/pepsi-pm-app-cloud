import { describe, expect, it } from 'vitest'
import {
  manhourChartBreakdownResponseSchema,
  manhourChartPerformanceResponseSchema,
} from './manhours.js'
import { resolveManhourChartRange } from '../services/manhour-chart.js'

describe('manhour chart schemas', () => {
  it('parses performance dashboard response', () => {
    const parsed = manhourChartPerformanceResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' },
      profile: {
        idwkctr: 'HR001',
        wkctr: 'PAC001',
        displayName: 'นาย A',
        position: 'ช่าง',
        wkctrtype: 'PM',
        imgmember: null,
        hasImage: false,
      },
      totalPlannedOrders: 12,
      utilizationPercent: 85.5,
      confirmHours: 40,
      manhourTotal: 46.78,
      zb: [{ wktype: 'ZB01', planned: 3, confirmed: 2, percent: 150 }],
    })
    expect(parsed.zb).toHaveLength(1)
  })

  it('parses pie breakdown response', () => {
    const parsed = manhourChartBreakdownResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' },
      wh: 40,
      ot1: 2,
      ot15: 0,
      ot1hol: 0,
      ot2: 0,
      ot3: 0,
      confirmHours: 35,
    })
    expect(parsed.confirmHours).toBe(35)
  })
})

describe('resolveManhourChartRange', () => {
  it('defaults to ~30 day window when dates omitted', () => {
    const r = resolveManhourChartRange()
    expect(r.to).toBeGreaterThan(r.from)
    expect(r.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accepts dd.mm.yyyy legacy dates', () => {
    const r = resolveManhourChartRange('01.04.2026', '01.05.2026')
    expect(r.to).toBeGreaterThanOrEqual(r.from)
  })
})
