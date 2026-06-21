import { describe, expect, it } from 'vitest'
import {
  manhourImportResponseSchema,
  manhourItemSchema,
  manhourUpsertBodySchema,
  worktimeMeResponseSchema,
} from './manhours.js'

describe('manhours schema', () => {
  it('accepts legacy M_manhour upsert payload with stworkday/workday and OT fields', () => {
    const parsed = manhourUpsertBodySchema.parse({
      idwkctr: 'HR001',
      stworkday: '01.05.2026',
      workday: '02.05.2026',
      wh: '8',
      ot1: '1',
      ot15: '1.5',
      ot1hol: 0,
      ot2: 0,
      ot3: 0,
    })

    expect(parsed.idwkctr).toBe('HR001')
    expect(parsed.wh).toBe(8)
    expect(parsed.ot15).toBe(1.5)
  })

  it('rejects negative hour values before service/database', () => {
    const parsed = manhourUpsertBodySchema.safeParse({
      idwkctr: 'HR001',
      stworkday: '01.05.2026',
      workday: '02.05.2026',
      wh: -1,
    })

    expect(parsed.success).toBe(false)
  })

  it('requires API rows to expose full period, hour breakdown, and total', () => {
    const parsed = manhourItemSchema.parse({
      idmanhour: 1,
      idwkctr: 'HR001',
      displayName: 'Somchai',
      wkctr: 'PAC001',
      stworkday: 1777568400,
      workday: 1777654800,
      startDate: '2026-05-01',
      endDate: '2026-05-02',
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

    expect(parsed.total).toBe(10.5)
  })

  it('models /worktime/me as summary plus daily rows', () => {
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

  it('accepts HR list rows with position and import result summary', () => {
    const item = manhourItemSchema.parse({
      idmanhour: 2,
      idwkctr: 'HR002',
      displayName: 'Technician',
      position: 'ช่าง',
      wkctr: 'PAC001',
      stworkday: 1777568400,
      workday: 1777568400,
      startDate: '2026-05-01',
      endDate: '2026-05-01',
      wh: 8,
      ot1: 0,
      ot15: 0,
      ot1hol: 0,
      ot2: 0,
      ot3: 0,
      total: 8,
      createdAt: null,
      updatedAt: null,
    })
    expect(item.position).toBe('ช่าง')

    const imported = manhourImportResponseSchema.parse({
      fileName: 'ManHours.xlsx',
      totalRows: 3,
      inserted: 2,
      updated: 1,
      skipped: 0,
      errors: 0,
      rows: [{ rowNo: 3, idwkctr: 'HR001', action: 'inserted' }],
    })
    expect(imported.inserted).toBe(2)
  })
})
