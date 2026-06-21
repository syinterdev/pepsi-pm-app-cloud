import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseMasterPlanWorkbook } from './master-plan-parse.js'
import {
  inferDisciplineFromSheetNames,
  inferWorkbookFamilyFromSheetNames,
  validateMasterPlanImport,
  validateParsedMasterPlanImport,
} from './master-plan-discipline-guard.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const customerDir = path.join(path.resolve(here, '../../../..'), 'docs from customer')

describe('master-plan-discipline-guard', () => {
  it('detects PK from sheet names', () => {
    const pk = readFileSync(path.join(customerDir, '03-MASTER PM PACKING 2026.xlsx'))
    const names = parseMasterPlanWorkbook(pk, 'PK').sheets.map((s) => s.sheetName)
    expect(inferWorkbookFamilyFromSheetNames(names)).toBe('PK')
    expect(inferDisciplineFromSheetNames(names)).toBe('PK')
  })

  it('detects process family from EE sheet names', () => {
    const ee = readFileSync(path.join(customerDir, '01-MASTER PM PROCESS EE 2026.xlsx'))
    const names = parseMasterPlanWorkbook(ee, 'EE').sheets.map((s) => s.sheetName)
    expect(inferWorkbookFamilyFromSheetNames(names)).toBe('PROCESS')
  })

  it('rejects PK file on EE tab (content)', () => {
    const pk = readFileSync(path.join(customerDir, '03-MASTER PM PACKING 2026.xlsx'))
    const parsed = parseMasterPlanWorkbook(pk, 'PK', '03-MASTER PM PACKING 2026.xlsx')
    const v = validateParsedMasterPlanImport('EE', parsed)
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.code).toBe('DISCIPLINE_MISMATCH')
      expect(v.detectedDiscipline).toBe('PK')
    }
  })

  it('accepts correct EE import', () => {
    const ee = readFileSync(path.join(customerDir, '01-MASTER PM PROCESS EE 2026.xlsx'))
    const parsed = parseMasterPlanWorkbook(ee, 'EE')
    expect(validateParsedMasterPlanImport('EE', parsed).ok).toBe(true)
  })

  it('accepts customer ME file regardless of shared process sheet names', () => {
    const me = readFileSync(path.join(customerDir, '02-MASTER PM PROCESS ME 2026.xlsx'))
    const parsed = parseMasterPlanWorkbook(me, 'ME', '02-MASTER PM PROCESS ME 2026.xlsx')
    expect(validateParsedMasterPlanImport('ME', parsed).ok).toBe(true)
  })

  it('allows EE file on ME tab — tab is authoritative for process workbooks', () => {
    const ee = readFileSync(path.join(customerDir, '01-MASTER PM PROCESS EE 2026.xlsx'))
    const parsed = parseMasterPlanWorkbook(ee, 'ME', '01-MASTER PM PROCESS EE 2026.xlsx')
    const v = validateParsedMasterPlanImport('ME', parsed)
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.warnings.some((w) => w.code === 'FILENAME_HINT_MISMATCH')).toBe(true)
  })

  it('accepts renamed file with warnings', () => {
    const v = validateMasterPlanImport('ME', 'PM-Mechanics-edited-2027.xlsx', ['Sheet1'])
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.warnings.some((w) => w.code === 'FILENAME_UNKNOWN')).toBe(true)
  })

  it('rejects process file on PK tab', () => {
    const ee = readFileSync(path.join(customerDir, '01-MASTER PM PROCESS EE 2026.xlsx'))
    const parsed = parseMasterPlanWorkbook(ee, 'PK', '01-MASTER PM PROCESS EE 2026.xlsx')
    const v = validateParsedMasterPlanImport('PK', parsed)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.code).toBe('DISCIPLINE_MISMATCH')
  })
})
