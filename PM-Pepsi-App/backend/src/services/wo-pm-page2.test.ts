import { describe, expect, it } from 'vitest'
import { loadWoPmPage2Form, updateWoPmPage2Equipment } from './wo-pm-page2.js'

describe('loadWoPmPage2Form', () => {
  it('maps DB row to API payload with RECEIVED signature text', async () => {
    const closed = new Date(2026, 4, 26)
    const signedAt = new Date('2026-05-27T10:00:00.000Z')
    const pool = {
      query: async () => ({
        rows: [
          {
            activity_report_wkctr: 'PRO015',
            completed_by_name: 'สมชาย ใจดี',
            closed_date: closed,
            equipment_ok: 'Y',
            signature_planner_name: 'KAEW',
            signature_at: signedAt,
            signature_action: 'approved',
          },
        ],
      }),
    }

    const form = await loadWoPmPage2Form(pool as never, 100)
    expect(form.activityReportWkctr).toBe('PRO015')
    expect(form.completedByName).toBe('สมชาย ใจดี')
    expect(form.closedDate).toBe('26.05.2026')
    expect(form.signatureText).toBe('RECEIVED by KAEW')
    expect(form.signatureAction).toBe('approved')
    expect(form.equipmentOk).toBe('Y')
  })

  it('returns empty payload when table missing', async () => {
    const pool = {
      query: async () => {
        throw new Error('relation "app.tbwo_pm_page2" does not exist')
      },
    }
    const form = await loadWoPmPage2Form(pool as never, 1)
    expect(form).toEqual({
      activityReportWkctr: null,
      completedByName: null,
      closedDate: null,
      signatureText: null,
      signatureAt: null,
      signatureAction: null,
      equipmentOk: null,
    })
  })
})

describe('updateWoPmPage2Equipment', () => {
  it('upserts equipment Y/N and returns mapped form', async () => {
    const pool = {
      query: async () => ({
        rows: [
          {
            activity_report_wkctr: null,
            completed_by_name: null,
            closed_date: null,
            equipment_ok: 'N',
            signature_planner_name: null,
            signature_at: null,
            signature_action: null,
          },
        ],
      }),
    }
    const form = await updateWoPmPage2Equipment(pool as never, 50, 'N')
    expect(form.equipmentOk).toBe('N')
  })
})
