import { describe, expect, it } from 'vitest'
import {
  extractMasterPlanLinkKeys,
  resolvePmMeasurementSuggestions,
  suggestsPmCurrent3Phase,
  suggestsPmVibrationDstDb,
} from './master-plan-row-links.js'

describe('extractMasterPlanLinkKeys', () => {
  const headers = [
    'Zone',
    'Machine List',
    'SAP Code',
    'Task list',
    'Legacy',
    'M/C',
    'PM list',
    'Measurement point',
  ]

  it('reads values from cells with fill-down display', () => {
    const cells = {
      Zone: '',
      'Machine List': 'Agitator',
      'SAP Code': '4000123',
      'Task list': 'TL01',
      Legacy: 'SE0-MI-EE',
      'M/C': '10000001',
      'PM list': 'ตรวจมอเตอร์',
      'Measurement point': '',
    }
    const display = { ...cells, Zone: 'SE0' }
    const keys = extractMasterPlanLinkKeys(headers, cells, display)
    expect(keys.zone).toBe('SE0')
    expect(keys.mntplan).toBe('4000123')
    expect(keys.pmlist).toBe('ตรวจมอเตอร์')
    expect(keys.mpoint).toBe('')
  })

  it('reads mpoint column', () => {
    const cells = {
      Zone: 'SE0',
      'Machine List': 'Pump',
      'SAP Code': '4000123',
      'Task list': 'TL01',
      Legacy: 'SE0-MI-EE',
      'M/C': '10000001',
      'PM list': 'Motor bearing',
      'Measurement point': 'Vibration Dst dB',
    }
    const keys = extractMasterPlanLinkKeys(headers, cells, cells)
    expect(keys.mpoint).toBe('Vibration Dst dB')
  })
})

describe('PM measurement row-link suggestions', () => {
  it('detects 3-phase current from Thai pmlist', () => {
    expect(suggestsPmCurrent3Phase('วัดกระแส 3 เฟสมอเตอร์')).toBe(true)
    expect(suggestsPmVibrationDstDb('วัดกระแส 3 เฟสมอเตอร์')).toBe(false)
  })

  it('detects vibration Dst/dB from pmlist or mpoint', () => {
    expect(suggestsPmVibrationDstDb('Vibration bearing')).toBe(true)
    expect(suggestsPmCurrent3Phase('Vibration bearing')).toBe(false)
    expect(suggestsPmVibrationDstDb('Motor check', 'Dst dB Lev')).toBe(true)
  })

  it('returns neither for unrelated tasks', () => {
    expect(resolvePmMeasurementSuggestions({ pmlist: 'Check grease' })).toEqual({
      current3Phase: false,
      vibrationDstDb: false,
    })
  })

  it('prioritises current when both keywords appear', () => {
    expect(
      resolvePmMeasurementSuggestions({
        pmlist: 'ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส',
        mpoint: 'Vibration mm/s',
      }),
    ).toEqual({ current3Phase: true, vibrationDstDb: false })
  })
})
