import { describe, expect, it } from 'vitest'
import {
  backlogManhourResponseSchema,
  backlogManhourSearchBodySchema,
} from './backlog.js'

describe('backlog manhour schema', () => {
 it('accepts manhour summary date range body', () => {
    const parsed = backlogManhourSearchBodySchema.parse({
      fromDate: '2026-05-01',
      toDate: '2026-05-01',
    })
    expect(parsed.fromDate).toBe('2026-05-01')
  })

  it('models manhour summary with plan/action minutes and WO rows', () => {
    const parsed = backlogManhourResponseSchema.parse({
      fromDate: '2026-05-01',
      toDate: '2026-05-01',
      plannedMinutes: 480,
      plannedHours: 8,
      actualMinutes: 60,
      actualHours: 1,
      totalOrders: 2,
      completionCount: 1,
      completionPercent: 50,
      byWkzb: [{ code: 'ZB01', label: 'ZB01', count: 1 }],
      rows: [
        {
          wkorder: '1001',
          wktype: 'ZB01',
          syst: 'REL',
          work: 8,
          actwork: 1,
          unit: 'H',
          operationshorttext: 'Pump check',
        },
      ],
    })

    expect(parsed.rows[0]?.unit).toBe('H')
    expect(parsed.completionPercent).toBe(50)
  })
})
