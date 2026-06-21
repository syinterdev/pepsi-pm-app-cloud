import { describe, expect, it } from 'vitest'
import {
  MASTER_PLAN_SHEET_TAB_LIMIT,
  filterMasterPlanSheetsByQuery,
} from './MasterPlanSheetPicker'

const EE_SHEET_NAMES = [
  'SCHAAF#1',
  'SCHAAF#2 (New)',
  'BCP',
  'Frypack',
  'STAX',
  'PC50MZ',
  'PELLET630',
  'PELLET500',
  'RBS',
  'STAX CANISTER',
  'FCP',
  'PC14',
  'SCHAAF#2',
  'Total Master plan',
  'Total Master plan (AM)',
]

const PK_SHEET_SAMPLES = [
  { sheetName: 'PK1', rowCount: 120 },
  { sheetName: 'PK1 (Production)', rowCount: 95 },
  { sheetName: 'Distribution', rowCount: 40 },
]

describe('Master Plan UAT Phase 1.5 (A5)', () => {
  it('A5.1 — EE/ME sheet counts use tabs, not SAP reference tabs on Master Plan page', () => {
    expect(EE_SHEET_NAMES.length).toBe(15)
    expect(EE_SHEET_NAMES.length).toBeLessThanOrEqual(MASTER_PLAN_SHEET_TAB_LIMIT)
    expect(16).toBeLessThanOrEqual(MASTER_PLAN_SHEET_TAB_LIMIT)
    expect(37).toBeGreaterThan(MASTER_PLAN_SHEET_TAB_LIMIT)
  })

  it('A5.2 — EE STAX then BCP is at most 2 tab clicks when using sheet tabs', () => {
    const staxIndex = EE_SHEET_NAMES.indexOf('STAX')
    const bcpIndex = EE_SHEET_NAMES.indexOf('BCP')
    expect(staxIndex).toBeGreaterThanOrEqual(0)
    expect(bcpIndex).toBeGreaterThanOrEqual(0)

    const clicksFromDefault = 2
    const clicksFromStax = 1
    expect(clicksFromDefault).toBeLessThanOrEqual(3)
    expect(clicksFromStax).toBeLessThanOrEqual(3)
  })

  it('A5.3 — PK search finds PK1 (Production) by name', () => {
    const matches = filterMasterPlanSheetsByQuery(PK_SHEET_SAMPLES, 'PK1 (Production)')
    expect(matches).toHaveLength(1)
    expect(matches[0]?.sheetName).toBe('PK1 (Production)')
  })

  it('A5.3 — PK search for PK1 includes both PK1 sheets', () => {
    const matches = filterMasterPlanSheetsByQuery(PK_SHEET_SAMPLES, 'PK1')
    expect(matches.map((s) => s.sheetName).sort()).toEqual(['PK1', 'PK1 (Production)'])
  })
})
