import { describe, expect, it } from 'vitest'
import {
  formatUntimeUnit,
  manhourDateWhereSql,
  manhourOtNet,
  manhourSummaryW,
  workValueToMinutes,
} from './manhour-minutes.js'

describe('manhour-minutes', () => {
 it('converts hour unit to minutes for hour-to-minute conversion', () => {
    expect(workValueToMinutes(8, 'H')).toBe(480)
    expect(workValueToMinutes(90, 'MIN')).toBe(90)
    expect(workValueToMinutes(2, 'h')).toBe(120)
  })

  it('formats untime for table display', () => {
    expect(formatUntimeUnit('H')).toBe('H')
    expect(formatUntimeUnit(null)).toBe('MIN')
  })

 it('computes Summary/W and OT net for HR manhour OT net', () => {
    const row = { wh: 8, ot1: 1, ot15: 1.5, ot1hol: 0, ot2: 2, ot3: 0 }
    expect(manhourSummaryW(row)).toBe(12.5)
    expect(manhourOtNet(row)).toBe(4.5)
  })

  it('uses exact-day SQL for single-day modal selection', () => {
    expect(manhourDateWhereSql(true)).toContain('bscstart = $2')
    expect(manhourDateWhereSql(false)).toContain('bscstart >=')
  })
})
