import { describe, expect, it } from 'vitest'
import { detailSheetRowsToTasklist, legacyWkctrtype } from './master-plan-tasklist.js'

describe('master-plan-tasklist', () => {
  it('maps legacy work center suffix', () => {
    expect(legacyWkctrtype('SE0-MI-EE', 'EE')).toBe('EE')
    expect(legacyWkctrtype('PK1-HI-ME', 'PK')).toBe('ME')
    expect(legacyWkctrtype('PK1-HI', 'PK')).toBe('PK')
  })

  it('converts detail rows with fill-down', () => {
    const headers = ['Zone', 'Machine List', 'Maintenance plan', 'Task list', 'Legacy', 'M/C', 'PM list', 'Min']
    const rows = [
      {
        rowIndex: 5,
        cells: {
          Zone: 'SE0',
          'Machine List': 'Mixer',
          'Maintenance plan': '100',
          'Task list': 'TL1',
          Legacy: 'SE0-MI-EE',
          'M/C': 'MC1',
          'PM list': 'Check motor',
          Min: '30',
        },
      },
      {
        rowIndex: 6,
        cells: {
          'PM list': 'Check belt',
          Min: '15',
        },
      },
    ]
    const { rows: mapped, skipped } = detailSheetRowsToTasklist(headers, rows, 'EE')
    expect(skipped).toBe(1)
    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.mntplan).toBe('100')
    expect(mapped[0]?.pmlist).toBe('Check motor')
  })
})
