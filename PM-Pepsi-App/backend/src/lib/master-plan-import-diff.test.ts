import { describe, expect, it } from 'vitest'
import { compareMasterPlanStructure, diffMasterPlanWorkbooks } from './master-plan-import-diff.js'
import type { ParsedMasterPlanWorkbook } from './master-plan-parse.js'

function wb(sheets: ParsedMasterPlanWorkbook['sheets']): ParsedMasterPlanWorkbook {
  return { discipline: 'EE', sourceFilename: 'test.xlsx', sheets }
}

describe('master-plan-import-diff', () => {
  it('detects missing sheets', () => {
    const published = wb([
      {
        sheetName: 'A',
        sortOrder: 0,
        titleRows: [],
        columnHeaders: ['Zone', 'PM list'],
        headerRowIndex: 0,
        sheetKind: 'detail',
        rows: [{ rowIndex: 1, cells: { Zone: 'Z1', 'PM list': 'P1' } }],
      },
    ])
    const imported = wb([
      {
        sheetName: 'B',
        sortOrder: 0,
        titleRows: [],
        columnHeaders: ['Zone', 'PM list'],
        headerRowIndex: 0,
        sheetKind: 'detail',
        rows: [],
      },
    ])
    const structure = compareMasterPlanStructure(published, imported)
    expect(structure.ok).toBe(false)
    expect(structure.missingSheets).toContain('A')
    expect(structure.extraSheets).toContain('B')
  })

  it('counts cell changes on matching structure', () => {
    const sheet = {
      sheetName: 'S1',
      sortOrder: 0,
      titleRows: [],
      columnHeaders: ['Zone', 'PM list', 'Min'],
      headerRowIndex: 0,
      sheetKind: 'detail' as const,
      rows: [{ rowIndex: 1, cells: { Zone: 'Z1', 'PM list': 'P1', Min: '30' } }],
    }
    const published = wb([sheet])
    const imported = wb([
      {
        ...sheet,
        rows: [{ rowIndex: 1, cells: { Zone: 'Z1', 'PM list': 'P1', Min: '45' } }],
      },
    ])
    const diff = diffMasterPlanWorkbooks(published, imported)
    expect(diff.structure.ok).toBe(true)
    expect(diff.totalRowsChanged).toBe(1)
    expect(diff.sampleChanges[0]?.fieldName).toBe('Min')
  })
})
