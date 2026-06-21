import { describe, expect, it } from 'vitest'
import {
  limitsFromLastReading,
  parseOptionalDbLimit,
  resolveVibrationDbLimits,
} from './pm-vibration-limits'

describe('pm-vibration-limits', () => {
  it('parseOptionalDbLimit', () => {
    expect(parseOptionalDbLimit('')).toBeNull()
    expect(parseOptionalDbLimit('40')).toBe(40)
    expect(parseOptionalDbLimit('x')).toBeNull()
  })

  it('resolveVibrationDbLimits prefers form when set', () => {
    expect(
      resolveVibrationDbLimits('42', '48', { warningLimit: 40, alarmLimit: 45 }),
    ).toEqual({ warning: 42, alarm: 48 })
  })

  it('resolveVibrationDbLimits falls back to saved', () => {
    expect(resolveVibrationDbLimits('', '', { warningLimit: 40, alarmLimit: 45 })).toEqual({
      warning: 40,
      alarm: 45,
    })
  })

  it('limitsFromLastReading', () => {
    expect(limitsFromLastReading([])).toEqual({ warning: '', alarm: '' })
    expect(
      limitsFromLastReading([{ warningLimit: 40, alarmLimit: null }, { warningLimit: 41, alarmLimit: 46 }]),
    ).toEqual({ warning: '41', alarm: '46' })
  })
})
