import { describe, expect, it } from 'vitest'
import {
  backlogManhourResponseSchema,
  manhourChartBreakdownResponseSchema,
  manhourChartPerformanceResponseSchema,
  manhourHrConfirmReportResponseSchema,
  manhourItemSchema,
  manhoursResponseSchema,
  worktimeMeResponseSchema,
  worktimePlanningResponseSchema,
} from '@/api/schemas'
import { manhourOtNet } from '@/features/manhours/format-manhour-date'

describe('manhours frontend schemas', () => {
  it('parses weekly summary chart rows for /manhours', () => {
    const parsed = manhoursResponseSchema.parse({
      weeks: [{ week: '2026-W18', planned: 40, actual: 36, backlog: 4 }],
    })
    expect(parsed.weeks[0]?.actual).toBe(36)
  })

  it('parses worktime/planning assignments for W_worktime_view', () => {
    const parsed = worktimePlanningResponseSchema.parse({
      idwkctr: 'HR001',
      items: [
        {
          idplanw: 2,
          idiw37: 50,
          mntplan: null,
          wkorder: 'WO99',
          startDate: '2026-05-01',
          endDate: null,
          assigner: 'PLN01',
          comment: null,
        },
      ],
    })
    expect(parsed.items[0]?.assigner).toBe('PLN01')
  })

  it('parses worktime/me daily breakdown for /worktime', () => {
    const parsed = worktimeMeResponseSchema.parse({
      idwkctr: 'HR001',
      total: { wh: 8, ot1: 1, ot15: 0, ot1hol: 0, ot2: 0, ot3: 0, total: 9 },
      items: [
        {
          workday: 1777568400,
          workDate: '2026-05-01',
          wh: 8,
          ot1: 1,
          ot15: 0,
          ot1hol: 0,
          ot2: 0,
          ot3: 0,
          total: 9,
        },
      ],
    })
    expect(parsed.items).toHaveLength(1)
  })

  it('parses HR manhour row and OT net helper matches legacy', () => {
    const row = manhourItemSchema.parse({
      idmanhour: 1,
      idwkctr: 'HR001',
      displayName: 'Somchai',
      position: 'ช่าง',
      wkctr: 'PAC001',
      stworkday: 1,
      workday: 1,
      startDate: null,
      endDate: null,
      wh: 8,
      ot1: 1,
      ot15: 1.5,
      ot1hol: 0,
      ot2: 0,
      ot3: 0,
      total: 10.5,
      createdAt: null,
      updatedAt: null,
    })
    expect(manhourOtNet(row)).toBe(2.5)
    expect(row.total).toBe(10.5)
  })

  it('parses chart performance and breakdown contracts', () => {
    const perf = manhourChartPerformanceResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-05-01' },
      profile: {
        idwkctr: 'HR001',
        wkctr: 'PAC001',
        displayName: 'A',
        position: null,
        wkctrtype: null,
        imgmember: null,
        hasImage: false,
      },
      totalPlannedOrders: 0,
      utilizationPercent: 0,
      confirmHours: 0,
      manhourTotal: 0,
      zb: [],
    })
    expect(perf.profile.wkctr).toBe('PAC001')
    const pie = manhourChartBreakdownResponseSchema.parse({
      range: perf.range,
      wh: 8,
      ot1: 0,
      ot15: 0,
      ot1hol: 0,
      ot2: 0,
      ot3: 0,
      confirmHours: 6,
    })
    expect(pie.wh).toBe(8)
  })

  it('parses HR vs Confirm team report contract', () => {
    const parsed = manhourHrConfirmReportResponseSchema.parse({
      range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-04-30' },
      period: 'month',
      periodLabel: 'เมษายน 2026',
      totals: {
        range: { from: 1, to: 2, fromDate: '2026-04-01', toDate: '2026-04-30' },
        wh: 100,
        ot1: 10,
        ot15: 5,
        ot1hol: 0,
        ot2: 2,
        ot3: 1,
        confirmHours: 80,
      },
      rows: [
        {
          idwkctr: 'HR001',
          wkctr: 'PAC010',
          displayName: 'นาย A',
          wh: 40,
          ot1: 5,
          ot15: 2,
          ot1hol: 0,
          ot2: 1,
          ot3: 0,
          totalManhours: 48,
          confirmHours: 35,
          utilizationPercent: 72.92,
        },
      ],
    })
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.period).toBe('month')
  })

  it('parses backlog manhour modal summary contract', () => {
    const parsed = backlogManhourResponseSchema.parse({
      fromDate: '2026-05-01',
      toDate: '2026-05-02',
      plannedMinutes: 100,
      plannedHours: 1.67,
      actualMinutes: 50,
      actualHours: 0.83,
      totalOrders: 1,
      completionCount: 0,
      completionPercent: 0,
      byWkzb: [],
      rows: [],
    })
    expect(parsed.plannedMinutes).toBe(100)
  })
})
