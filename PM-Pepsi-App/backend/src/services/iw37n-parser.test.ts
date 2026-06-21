import { describe, expect, it } from 'vitest'
import {
  detectIw37nLayout,
  parseDdMmYyyy,
  parseExcelOrDdMmDate,
  parseIw37nMatrix,
  rowFailsPhpImportValidation,
} from './iw37n-parser.js'

describe('detectIw37nLayout', () => {
  it('detects sap_alv from Dynamic List Display banner', () => {
    const matrix: unknown[][] = [
      ['18.03.2020  Dynamic List Display  1', '', ''],
      ['', '', ''],
      ['', 'S', 'MntPlan', 'Order', 'OpAc'],
    ]
    expect(detectIw37nLayout(matrix)).toBe('sap_alv')
  })

  it('detects legacy from MntPlan header row', () => {
    const matrix: unknown[][] = [
      ['MntPlan', 'Order', 'Type', 'MAT', 'Bsc start', 'OpAc'],
      [356913, 4000064331, 'ZB02', 2, 43987, '', 'REL', 10, 'op text'],
    ]
    expect(detectIw37nLayout(matrix)).toBe('legacy')
  })

  it('detects sap_alv when header starts at column S', () => {
    const matrix: unknown[][] = [
      ['', '', ''],
      ['', 'S', 'MntPlan', 'Order', 'Type', 'OpAc'],
    ]
    expect(detectIw37nLayout(matrix)).toBe('sap_alv')
  })
})

describe('parseExcelOrDdMmDate', () => {
  it('parses dd.mm.yyyy', () => {
    const sec = parseDdMmYyyy('25.01.2020')
    expect(sec).not.toBeNull()
    expect(new Date(sec! * 1000).getFullYear()).toBe(2020)
  })

  it('parses excel serial', () => {
    const sec = parseExcelOrDdMmDate(43987)
    expect(sec).not.toBeNull()
  })
})

describe('parseIw37nMatrix', () => {
  it('parses minimal sap_alv rows with column offset +2', () => {
    const matrix: unknown[][] = [
      ['Dynamic List Display', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', 'S', 'MntPlan', 'Order', 'Type', 'MAT', 'Bsc start', 'Act.finish', 'System status', 'OpAc', 'Operation short text', '', '', 'Op.WorkCtr', 'Work', 'Act. work', 'Un.', 'Equipment descriptn', 'FunctLocDescrip.'],
      ['', '', ''],
      [
        '',
        '',
        610000004147,
        4000113383,
        'ZB02',
        2,
        '25.01.2020',
        '',
        'TECO NMAT',
        10,
        '6M - EE Fryer',
        'desc',
        '',
        'PRO002',
        30,
        0,
        'MIN',
        'Fryer Zone',
        'FACTORY 1 PC50MZ',
      ],
    ]
    const { layout, rows } = parseIw37nMatrix(matrix)
    expect(layout).toBe('sap_alv')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.wkorder).toBe('4000113383')
    expect(rows[0]?.opac).toBe('10')
    expect(rows[0]?.equipment).toBe('')
    expect(rows[0]?.equdescrip).toBe('Fryer Zone')
    expect(rows[0]?.funcdescrip).toBe('FACTORY 1 PC50MZ')
    expect(rows[0]?.functionalloc).toContain('7151')
    expect(rows[0]?.functionalloc).toContain('FACTORY')
    expect(rows[0]?.bscstart).not.toBeNull()
  })

  it('parses minimal legacy rows from row index 2', () => {
    const matrix: unknown[][] = [
      ['MntPlan', 'Order', 'Type', 'MAT', 'Bsc start', 'Act.finish', 'System status', 'OpAc', 'Operation short text', 'Description', 'C', 'Op.WorkCtr', 'Work', 'Act. work', 'Un.', 'Equipment', 'Equipment descriptn', 'Functional Loc.', 'FunctLocDescrip.'],
      ['skip', 'skip', 'ZB02', 2, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [
        356913,
        4000064331,
        'ZB02',
        2,
        '30.06.2020',
        '',
        'REL NMAT',
        10,
        'ทำความสะอาด',
        'PM desc',
        '',
        'PAC002',
        120,
        0,
        'MIN',
        10049852,
        'CONVEYOR',
        'PI-TH-7151',
        'PACKING AREA',
      ],
    ]
    const { layout, rows } = parseIw37nMatrix(matrix)
    expect(layout).toBe('legacy')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.wkorder).toBe('4000064331')
    expect(rows[0]?.equipment).toBe('10049852')
    expect(rows[0]?.functionalloc).toBe('PI-TH-7151')
  })

 it('matches IW37N import validation empty-column validation', () => {
    const valid = [
      '',
      '',
      610000004147,
      4000113383,
      'ZB02',
      2,
      '25.01.2020',
      '',
      'TECO',
      10,
      'op',
      '',
      '',
      'PRO002',
      30,
      0,
      'MIN',
      'Fryer Zone',
      'FACTORY',
    ]
    expect(rowFailsPhpImportValidation(valid, 2)).toBe(false)
    const missing = [...valid]
    missing[18] = ''
    expect(rowFailsPhpImportValidation(missing, 2)).toBe(true)
  })

  it('skips header-like data rows', () => {
    const matrix: unknown[][] = [
      ['Dynamic List Display'],
      ['', 'S', 'MntPlan', 'Order', 'OpAc'],
      ['', '', 'Order', 'OpAc', '', '', '', '', '', '', '', '', '', '', '', '', '', 'x', 'y'],
    ]
    const { rows } = parseIw37nMatrix(matrix)
    expect(rows).toHaveLength(0)
  })
})
