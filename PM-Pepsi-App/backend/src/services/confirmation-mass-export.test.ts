import { describe, expect, it } from 'vitest'
import {
  massConfirmExportSummarySchema,
  qcApproveBatchResponseSchema,
} from '../schemas/confirmation-mass-export.js'

describe('confirmation-mass-export schemas', () => {
  it('parses empty summary', () => {
    const parsed = massConfirmExportSummarySchema.parse({
      total: 0,
      complete: true,
      hasConfirm: 0,
      qcApproved: 0,
      qcPending: 0,
      qcRejected: 0,
      exportable: 0,
      items: [],
    })
    expect(parsed.exportable).toBe(0)
  })

  it('parses approve-batch response', () => {
    const parsed = qcApproveBatchResponseSchema.parse({
      approved: [1, 2],
      skipped: [{ idiw37: 3, wkorder: 'WO3', reason: 'ยังไม่มีข้อมูลปิดงาน' }],
    })
    expect(parsed.approved).toEqual([1, 2])
    expect(parsed.skipped).toHaveLength(1)
  })
})
