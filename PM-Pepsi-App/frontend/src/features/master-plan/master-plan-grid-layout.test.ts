import { describe, expect, it } from 'vitest'
import {
  computeColumnRowspans,
  extractSheetBannerTitle,
  extractSheetMetaLines,
  isMasterPlanCellEditable,
  masterPlanColumnWidthClass,
  splitGenericSheetSections,
  type MasterPlanGridRow,
} from './master-plan-grid-layout'

describe('master-plan-grid-layout', () => {
  it('extracts MASTER PLAN banner title', () => {
    const title = extractSheetBannerTitle([
      ['', '', 'STAX EE MASTER PLAN', ''],
      ['', '', 'Maintenance plan', 'Task list'],
    ])
    expect(title).toBe('STAX EE MASTER PLAN')
  })

  it('computes rowspan for merged Min/Man columns', () => {
    const rows = [
      { rowIndex: 1, cells: { Min: '30' }, display: { Min: '30' } },
      { rowIndex: 2, cells: { Min: '' }, display: { Min: '30' } },
    ]
    expect(computeColumnRowspans(rows, 'Min')).toEqual([2, 'skip'])
  })

  it('extracts meta lines excluding banner', () => {
    const meta = extractSheetMetaLines([
      ['', '', 'STAX EE MASTER PLAN'],
      ['', '', 'Maintenance plan', 'Task list', '', '', 'Update : 16/03/2022'],
    ])
    expect(meta.some((l) => l.includes('Maintenance plan'))).toBe(true)
    expect(meta.some((l) => l.includes('Update'))).toBe(true)
  })

  it('splits generic summary sheet into side-by-side sections', () => {
    const rows = [
      {
        rowIndex: 0,
        cells: { col0: 'Maintenance plan', col3: 'Task list' },
        display: { col0: 'Maintenance plan', col3: 'Task list' },
      },
      {
        rowIndex: 1,
        cells: { col0: 'By line', col1: 'QTY', col3: 'By line', col4: 'QTY' },
        display: { col0: 'By line', col1: 'QTY', col3: 'By line', col4: 'QTY' },
      },
      {
        rowIndex: 2,
        cells: {
          col0: 'STAX',
          col1: '36 Maintenance plan',
          col3: 'STAX',
          col4: '37 Maintenance plan',
        },
        display: {
          col0: 'STAX',
          col1: '36 Maintenance plan',
          col3: 'STAX',
          col4: '37 Maintenance plan',
        },
      },
    ] as MasterPlanGridRow[]
    const sections = splitGenericSheetSections(rows, ['col0', 'col1', 'col2', 'col3', 'col4'])
    expect(sections).toHaveLength(2)
    expect(sections[0]?.columns).toEqual(['col0', 'col1'])
    expect(sections[1]?.columns).toEqual(['col3', 'col4'])
    expect(sections[0]?.rows[0]?.[0]).toBe('Maintenance plan')
  })

  it('applies narrow width class for Zone and wide for PM list', () => {
    expect(masterPlanColumnWidthClass('Zone')).toContain('4.5rem')
    expect(masterPlanColumnWidthClass('PM list')).toContain('17.5rem')
  })

  it('marks Zone and Machine List as non-editable anchors', () => {
    expect(isMasterPlanCellEditable('detail', 'Zone', true)).toBe(false)
    expect(isMasterPlanCellEditable('detail', 'Machine List', true)).toBe(false)
    expect(isMasterPlanCellEditable('detail', 'Min', true)).toBe(true)
    expect(isMasterPlanCellEditable('summary', 'Min', true)).toBe(false)
  })
})
