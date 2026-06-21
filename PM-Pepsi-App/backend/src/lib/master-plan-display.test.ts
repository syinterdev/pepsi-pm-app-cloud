import { describe, expect, it } from 'vitest'
import { applyFillDownDisplay } from './master-plan-display.js'

describe('applyFillDownDisplay', () => {
  it('fills empty Zone from row above', () => {
    const rows = [
      { rowIndex: 3, cells: { Zone: 'SE0', 'Machine List': 'Batch Mixer' } },
      { rowIndex: 4, cells: { Zone: '', 'Machine List': 'Agitator' } },
    ]
    const out = applyFillDownDisplay(rows, ['Zone', 'Machine List'])
    expect(out[1]?.display.Zone).toBe('SE0')
    expect(out[1]?.display['Machine List']).toBe('Agitator')
  })

  it('fills Machine List from row above when empty', () => {
    const rows = [
      { rowIndex: 1, cells: { Zone: 'PK1', 'Machine List': 'Line A' } },
      { rowIndex: 2, cells: { Zone: '', 'Machine List': '' } },
    ]
    const out = applyFillDownDisplay(rows, ['Zone', 'Machine List'])
    expect(out[1]?.display.Zone).toBe('PK1')
    expect(out[1]?.display['Machine List']).toBe('Line A')
  })

  it('fills Min, Man, Man hour from row above when empty (Excel merge)', () => {
    const rows = [
      { rowIndex: 251, cells: { Min: '30', Man: '1', 'Man hour': '30' } },
      { rowIndex: 252, cells: { Min: '', Man: '', 'Man hour': '' } },
    ]
    const out = applyFillDownDisplay(rows, ['Min', 'Man', 'Man hour'])
    expect(out[1]?.display.Min).toBe('30')
    expect(out[1]?.display.Man).toBe('1')
    expect(out[1]?.display['Man hour']).toBe('30')
  })
})
