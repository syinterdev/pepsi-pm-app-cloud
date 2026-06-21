import { describe, expect, it } from 'vitest'
import { resolvePmExecutionStatus } from './wo-pm-execution.js'

describe('resolvePmExecutionStatus', () => {
  it('returns closed for TECO/CLSD', () => {
    expect(resolvePmExecutionStatus({ syst: 'TECO' })).toBe('closed')
    expect(resolvePmExecutionStatus({ syst: 'CLSD' })).toBe('closed')
  })

  it('returns done when QC approved but still REL', () => {
    expect(
      resolvePmExecutionStatus({
        syst: 'REL',
        confirmQcStatus: 'approved',
        percentClose: 50,
      }),
    ).toBe('done')
  })

  it('returns done when percent close is 100', () => {
    expect(
      resolvePmExecutionStatus({ syst: 'REL', percentClose: 100 }),
    ).toBe('done')
  })

  it('returns in_progress for open WO without completion', () => {
    expect(resolvePmExecutionStatus({ syst: 'REL' })).toBe('in_progress')
    expect(
      resolvePmExecutionStatus({ syst: 'CRTD', percentClose: 0 }),
    ).toBe('in_progress')
  })
})
