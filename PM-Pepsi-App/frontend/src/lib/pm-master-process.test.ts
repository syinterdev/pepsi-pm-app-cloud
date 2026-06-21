import { describe, expect, it } from 'vitest'
import {
  parsePmMasterProcessSheet,
  pmMasterRowsToTasklistImport,
} from '@/lib/pm-master-process'

describe('parsePmMasterProcessSheet', () => {
  it('parses EE-style header row', () => {
    const values = [
      ['', '', 'SCHAAF EE MASTER PLAN'],
      ['Zone', 'Machine List', 'SAP Code', 'Task list', 'Legacy', 'M/C', 'PM list', 'days'],
      ['SE0', 'Batch Mixer', '610000004477', '100911', 'SE0-FI-EE', 'Batch Mixer', 'ตรวจเช็คกระแสไฟ', 15],
      ['', 'Agitator', '', '', 'SE0-MI-EE', 'Agitator', 'ตรวจเช็คสายไฟ', 30],
    ]
    const rows = parsePmMasterProcessSheet(values, 'SCHAAF#1')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.zone).toBe('SE0')
    expect(rows[0]?.tasklist).toBe('100911')
    expect(rows[1]?.zone).toBe('SE0')
    expect(rows[1]?.machineList).toBe('Agitator')
  })

  it('maps to tasklist import rows', () => {
    const rows = parsePmMasterProcessSheet(
      [
        ['Zone', 'Machine List', 'Maintenance plan', 'Task list', 'Legacy', 'M/C', 'PM list', 'freq (day)'],
        ['BC0', 'Vertical Blender', '610000004809', '101243', 'BC0-WC-ME', 'RO Unit', 'ทำความสะอาด', 7],
      ],
      'BCP',
    )
    const mapped = pmMasterRowsToTasklistImport(rows, 'ME')
    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.wkctrtype).toBe('ME')
    expect(mapped[0]?.zone).toBe('BC0')
  })
})
