import { describe, expect, it } from 'vitest'
import {
  assertPlannerReviewerRole,
  confirmQcStatusLabel,
  isConfirmQcApproved,
  isPlannerReviewerRole,
} from './confirm-qc-status.js'

describe('confirm-qc-status', () => {
  it('approved only when status is approved', () => {
    expect(isConfirmQcApproved('approved')).toBe(true)
    expect(isConfirmQcApproved('pending')).toBe(false)
    expect(isConfirmQcApproved('rejected')).toBe(false)
    expect(isConfirmQcApproved(null)).toBe(false)
  })

  it('labels in Thai', () => {
    expect(confirmQcStatusLabel('pending')).toContain('Planner')
    expect(confirmQcStatusLabel('approved')).toContain('อนุมัติ')
  })

  it('planner reviewer role is U only', () => {
    expect(isPlannerReviewerRole('U')).toBe(true)
    expect(isPlannerReviewerRole('A')).toBe(false)
    expect(() => assertPlannerReviewerRole('A')).toThrow('PLANNER_REVIEW_REQUIRED')
  })
})
