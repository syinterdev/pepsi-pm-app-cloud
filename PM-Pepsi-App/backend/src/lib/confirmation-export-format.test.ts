import { describe, expect, it } from 'vitest'
import {
  buildConfirmationExportRow,
  formatActWorkMinutes,
  formatOpacDisplay,
} from './confirmation-export-format.js'

describe('confirmation-export-format', () => {
  it('formats Act.Work to 2 decimal places', () => {
    expect(formatActWorkMinutes(60)).toBe(60)
    expect(formatActWorkMinutes(60.125)).toBe(60.13)
    expect(formatActWorkMinutes(90.004)).toBe(90)
  })

  it('strips leading zeros from Operation', () => {
    expect(formatOpacDisplay('0010')).toBe('10')
    expect(formatOpacDisplay(10)).toBe('10')
  })

  it('maps epoch seconds to DDMMYYYY and HH:mm', () => {
    const row = buildConfirmationExportRow(0, {
      wkorder: '4001571110',
      opac: '0010',
      wkctr: 'UTI008',
      timewk: 60,
      unitc: 'Min',
      stdate: Math.floor(new Date(2026, 4, 27, 15, 0, 0).getTime() / 1000),
      endate: Math.floor(new Date(2026, 4, 27, 16, 0, 0).getTime() / 1000),
    })
    expect(row.no).toBe(1)
    expect(row.opac).toBe('10')
    expect(row.timewk).toBe(60)
    expect(row.startDateExe).toBe('27052026')
    expect(row.endDateExe).toBe('27052026')
    expect(row.startExecute).toBe('15:00')
    expect(row.endExecute).toBe('16:00')
  })
})
