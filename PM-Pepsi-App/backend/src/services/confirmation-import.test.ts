import { describe, expect, it } from 'vitest'
import {
  detectConfirmLayout,
  parseConfirmDateTime,
  parseConfirmFileWithMeta,
  parseConfirmMatrix,
  parseDdMmYyyy,
} from './confirmation-import.js'

describe('detectConfirmLayout', () => {
  it('detects sap_alv from Dynamic List Display', () => {
    const matrix: unknown[][] = [
      ['Dynamic List Display', '', ''],
      ['', 'S', 'Confirm.', 'Order', 'WkCtrAct', 'Act. work'],
    ]
    expect(detectConfirmLayout(matrix)).toBe('sap_alv')
  })

  it('detects legacy when Confirm at 0 and Order at 3', () => {
    const matrix: unknown[][] = [
      ['Confirm.', 'Counter', 'OrdCat', 'Order', 'Postg date', 'WkCtrAct', 'Act. work'],
    ]
    expect(detectConfirmLayout(matrix)).toBe('legacy')
  })
})

describe('parseConfirmDateTime', () => {
  it('combines dd.mm.yyyy with excel day fraction', () => {
    const sec = parseConfirmDateTime('13.01.2020', 0.3644444444444444)
    expect(sec).not.toBeNull()
  })

  it('parses dd.mm.yyyy close date', () => {
    expect(parseDdMmYyyy('26.06.2018')).not.toBeNull()
  })
})

describe('parseConfirmMatrix', () => {
  it('parses minimal sap_alv confirm row', () => {
    const matrix: unknown[][] = [
      ['Dynamic List Display'],
      ['', '', ''],
      ['', '', ''],
      [
        '',
        'S',
        'Confirm.',
        'Postg date',
        'Counter',
        'WkCtrPln',
        'WkCtrAct',
        'Act. work',
        'Un. WkAct',
        'H.',
        'OrdCat',
        'Act. start',
        'Act.finish',
        'Act.start',
        'Act.finish',
        'Order',
        'Equipment',
        'Functional Location',
      ],
      ['', '', ''],
      [
        '',
        '',
        3021735,
        '13.01.2020',
        1,
        'PAC002',
        'PAC002',
        960,
        'MIN',
        16,
        'ZB02',
        '13.01.2020',
        '13.01.2020',
        0.3644444444444444,
        0.5724537037037037,
        4000073467,
        10051083,
        'PI-TH-7151',
        '',
      ],
    ]
    const { layout, results } = parseConfirmMatrix(matrix)
    const ok = results.filter((r) => r.kind === 'ok')
    expect(layout).toBe('sap_alv')
    expect(ok).toHaveLength(1)
    if (ok[0]?.kind === 'ok') {
      expect(ok[0].row.wkorder).toBe('4000073467')
      expect(ok[0].row.timewk).toBe(960)
      expect(ok[0].row.timeclose).not.toBeNull()
    }
  })
})
