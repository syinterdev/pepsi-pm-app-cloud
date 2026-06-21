import { describe, expect, it } from 'vitest'
import {
  assessMasterPlanFileForDiscipline,
  inferMasterPlanDisciplineFromFilename,
} from './master-plan-discipline-guard'

describe('master-plan-discipline-guard (frontend)', () => {
  it('detects customer filenames as hints', () => {
    expect(inferMasterPlanDisciplineFromFilename('01-MASTER PM PROCESS EE 2026.xlsx')).toBe('EE')
    expect(inferMasterPlanDisciplineFromFilename('03-MASTER PM PACKING 2026.xlsx')).toBe('PK')
  })

  it('blocks PK filename on EE tab', () => {
    const file = new File([''], '03-MASTER PM PACKING 2026.xlsx')
    const check = assessMasterPlanFileForDiscipline(file, 'EE')
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.reason).toBe('packingOnProcess')
  })

  it('allows renamed ME file with warning', () => {
    const file = new File([''], 'PM-Mechanics-edited-2027.xlsx')
    const check = assessMasterPlanFileForDiscipline(file, 'ME')
    expect(check.ok).toBe(true)
    if (check.ok) expect(check.warnings).toContain('FILENAME_UNKNOWN')
  })

  it('allows EE filename on ME tab with hint warning', () => {
    const file = new File([''], '01-MASTER PM PROCESS EE 2026.xlsx')
    const check = assessMasterPlanFileForDiscipline(file, 'ME')
    expect(check.ok).toBe(true)
    if (check.ok) expect(check.warnings).toContain('FILENAME_HINT_MISMATCH')
  })
})
