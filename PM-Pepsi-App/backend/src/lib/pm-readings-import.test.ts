import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import {
  buildPmReadingsImportTemplateBuffer,
  parseMeasuredAt,
  parsePmReadingsWorkbook,
  parseVibrationWideSheet,
  pmReadingsImportHeaderRow,
} from './pm-readings-import.js'

describe('pmReadingsImportHeaderRow', () => {
  it('uses Phase R/S/T for current and Dst/dB for vibration', () => {
    expect(pmReadingsImportHeaderRow('current_3phase')).toEqual([
      'เลข WO',
      'เครื่องจักร',
      'รายการ PM',
      'ประเภทการวัด',
      'วันเวลาวัด',
      'Phase R (A)',
      'Phase S (A)',
      'Phase T (A)',
      'Warning',
      'Alarm',
    ])
    expect(pmReadingsImportHeaderRow('vibration_dst_db')).toEqual([
      'เลข WO',
      'เครื่องจักร',
      'รายการ PM',
      'ประเภทการวัด',
      'วันเวลาวัด',
      'Dst',
      'dB',
      '',
      'Warning',
      'Alarm',
    ])
  })
})

describe('parseMeasuredAt', () => {
  it('accepts time-only HH:mm for chart rows', () => {
    const d = parseMeasuredAt('08:00')
    expect(d).not.toBeNull()
    expect(d!.getHours()).toBe(8)
    expect(d!.getMinutes()).toBe(0)
  })

  it('accepts D/M/Y customer dates', () => {
    const d = parseMeasuredAt('16/1/2017')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2017)
    expect(d!.getMonth()).toBe(0)
    expect(d!.getDate()).toBe(16)
  })

  it('inherits base date for time-only trend rows', () => {
    const base = parseMeasuredAt('16/1/2017')
    const d = parseMeasuredAt('08:00', base)
    expect(d!.getFullYear()).toBe(2017)
    expect(d!.getHours()).toBe(8)
  })
})

describe('parseVibrationWideSheet', () => {
  it('converts wide Excel (date row + Dst/dB cells) to tall rows', () => {
    const aoa = [
      ['D/M/Y', 'Main Oil Pump', '', 'Main Oil Pump'],
      ['', 'Motor Front', 'Motor Rear', 'Pump Point#1'],
      ['16/1/2017', 'Dst 08 dB 45', 'Dst 07 dB 30', 'Dst 07 dB 34'],
      ['15/2/2017', 'Dst 08 dB 42', 'Dst 06 dB 34', 'Dst 05 dB 30'],
    ]
    const { rows, issues } = parseVibrationWideSheet(aoa, 'Fry Pack', '4001565681')
    expect(issues).toHaveLength(0)
    expect(rows).toHaveLength(6)
    expect(rows[0]).toMatchObject({
      wkorder: '4001565681',
      machine: 'Main Oil Pump',
      pmlist: 'Main Oil Pump — Motor Front',
      kind: 'vibration_dst_db',
      v1: 8,
      v2: 45,
      v3: null,
    })
    expect(rows.find((r) => r.pmlist.includes('Pump Point#1'))?.v2).toBe(34)
  })

  it('returns empty without default WO', () => {
    const aoa = [['D/M/Y', 'Motor Front'], ['16/1/2017', 'Dst 08 dB 45']]
    expect(parseVibrationWideSheet(aoa, 'BCP', '').rows).toHaveLength(0)
  })
})

describe('parsePmReadingsWorkbook', () => {
  it('parses customer template (WO 4001565681)', () => {
    const buf = buildPmReadingsImportTemplateBuffer()
    const { rows, issues } = parsePmReadingsWorkbook(buf)
    expect(issues).toHaveLength(0)
    expect(rows.length).toBeGreaterThanOrEqual(12)

    const oilPump = rows.find((r) => r.machine === 'Main Oil Pump' && r.v1 === 97.5)
    expect(oilPump?.wkorder).toBe('4001565681')
    expect(oilPump?.kind).toBe('current_3phase')
    expect(oilPump?.v2).toBe(97.6)
    expect(oilPump?.v3).toBe(96.2)

    const trend = rows.find((r) => r.machine === 'Main Oil Pump' && r.v1 === 120)
    expect(trend?.kind).toBe('current_3phase')
    expect(trend?.v2).toBe(118)
    expect(trend?.v3).toBe(121)

    const combo = rows.find((r) => r.pmlist === 'Motor Front' && r.v1 === 8 && r.v2 === 45)
    expect(combo?.kind).toBe('vibration_dst_db')
    expect(combo?.v3).toBeNull()

    const lev = rows.find((r) => r.pmlist === 'Motor Rear')
    expect(lev?.v1).toBe(7)
    expect(lev?.v2).toBe(37)
    expect(lev?.v3).toBeNull()

    const vibTrend = rows.find((r) => r.pmlist === 'Motor Front' && r.v1 === 7 && r.v2 === 40)
    expect(vibTrend?.kind).toBe('vibration_dst_db')
  })

  it('parses wide sheet when default WO provided', () => {
    const aoa = [
      ['D/M/Y', 'Motor Front'],
      ['16/1/2017', 'Dst:07 dB Lev:37'],
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Pellet')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
    const { rows } = parsePmReadingsWorkbook(buf, { defaultWkorder: '4001565681' })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.v1).toBe(7)
    expect(rows[0]?.v2).toBe(37)
  })
})
