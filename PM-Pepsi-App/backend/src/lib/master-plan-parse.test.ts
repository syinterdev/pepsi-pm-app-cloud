import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { inferDisciplineFromFilename, parseMasterPlanWorkbook } from './master-plan-parse.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../../..')
const customerDir = path.join(repoRoot, 'docs from customer')

const EE = path.join(customerDir, '01-MASTER PM PROCESS EE 2026.xlsx')
const ME = path.join(customerDir, '02-MASTER PM PROCESS ME 2026.xlsx')
const PK = path.join(customerDir, '03-MASTER PM PACKING 2026.xlsx')

describe('inferDisciplineFromFilename', () => {
  it('detects EE, ME, PK from customer filenames', () => {
    expect(inferDisciplineFromFilename('01-MASTER PM PROCESS EE 2026.xlsx')).toBe('EE')
    expect(inferDisciplineFromFilename('02-MASTER PM PROCESS ME 2026.xlsx')).toBe('ME')
    expect(inferDisciplineFromFilename('03-MASTER PM PACKING 2026.xlsx')).toBe('PK')
  })

  it('rejects PK file on EE tab scenario', () => {
    expect(inferDisciplineFromFilename('03-MASTER PM PACKING 2026.xlsx')).not.toBe('EE')
  })
})

describe('parseMasterPlanWorkbook', () => {
  it('EE has 15 sheets in original order', () => {
    const buf = readFileSync(EE)
    const wb = parseMasterPlanWorkbook(buf, 'EE')
    expect(wb.sheets.map((s) => s.sheetName)).toEqual([
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
    ])
  })

  it('SCHAAF#1 header includes Zone and PM list', () => {
    const buf = readFileSync(EE)
    const sheet = parseMasterPlanWorkbook(buf, 'EE').sheets.find((s) => s.sheetName === 'SCHAAF#1')!
    expect(sheet.columnHeaders).toContain('Zone')
    expect(sheet.columnHeaders.some((h) => h.toLowerCase().includes('pm list'))).toBe(true)
  })

  it('does not skip Total Master plan sheet', () => {
    const buf = readFileSync(EE)
    const names = parseMasterPlanWorkbook(buf, 'EE').sheets.map((s) => s.sheetName)
    expect(names).toContain('Total Master plan')
  })

  it('ME has 16 sheets', () => {
    const buf = readFileSync(ME)
    expect(parseMasterPlanWorkbook(buf, 'ME').sheets).toHaveLength(16)
  })

  it('PK has 37 sheets', () => {
    const buf = readFileSync(PK)
    expect(parseMasterPlanWorkbook(buf, 'PK').sheets).toHaveLength(37)
  })

  it('PK includes PK1 and PK1 (Production) as separate sheets', () => {
    const buf = readFileSync(PK)
    const names = parseMasterPlanWorkbook(buf, 'PK').sheets.map((s) => s.sheetName)
    expect(names).toContain('PK1')
    expect(names).toContain('PK1 (Production)')
  })
})
