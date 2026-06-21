import { describe, expect, it } from 'vitest'
import { resolveMasterPlanColumnHintKey } from './master-plan-column-hints'

describe('resolveMasterPlanColumnHintKey', () => {
  it('maps core EE/ME headers', () => {
    expect(resolveMasterPlanColumnHintKey('Zone')).toBe('zone')
    expect(resolveMasterPlanColumnHintKey('Machine List')).toBe('machineList')
    expect(resolveMasterPlanColumnHintKey('PM list')).toBe('pmlist')
    expect(resolveMasterPlanColumnHintKey('Legacy')).toBe('legacy')
    expect(resolveMasterPlanColumnHintKey('M/C')).toBe('machine')
    expect(resolveMasterPlanColumnHintKey('Task list')).toBe('tasklist')
    expect(resolveMasterPlanColumnHintKey('Min')).toBe('min')
    expect(resolveMasterPlanColumnHintKey('Man')).toBe('man')
  })

  it('maps SAP / frequency variants', () => {
    expect(resolveMasterPlanColumnHintKey('SAP Code')).toBe('sapCode')
    expect(resolveMasterPlanColumnHintKey('Maintenance plan')).toBe('sapCode')
    expect(resolveMasterPlanColumnHintKey('freq (day)')).toBe('freqDay')
    expect(resolveMasterPlanColumnHintKey('days')).toBe('days')
  })

  it('maps PK headers', () => {
    expect(resolveMasterPlanColumnHintKey('Frequency')).toBe('freqDay')
    expect(resolveMasterPlanColumnHintKey('Type')).toBe('type')
    expect(resolveMasterPlanColumnHintKey('Craft')).toBe('craft')
  })

  it('returns null for unknown or generic columns', () => {
    expect(resolveMasterPlanColumnHintKey('col0')).toBeNull()
    expect(resolveMasterPlanColumnHintKey('')).toBeNull()
    expect(resolveMasterPlanColumnHintKey('Custom field')).toBeNull()
  })

  it('prefers machine list over machine', () => {
    expect(resolveMasterPlanColumnHintKey('Machine List')).toBe('machineList')
  })
})
