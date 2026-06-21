import { describe, expect, it } from 'vitest'
import { inferPmMeasurementKind } from './pm-measurement-kind.js'

describe('inferPmMeasurementKind', () => {
  it('detects 3-phase current from Thai task text', () => {
    expect(
      inferPmMeasurementKind({
        pmlist: 'ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส',
      }),
    ).toBe('current_3phase')
  })

  it('detects vibration from mpoint', () => {
    expect(
      inferPmMeasurementKind({
        mpoint: 'Vibration mm/s RMS',
        pmlist: 'Motor bearing',
      }),
    ).toBe('vibration_dst_db')
  })

  it('prioritises current over vibration when task mentions กระแส', () => {
    expect(
      inferPmMeasurementKind({
        pmlist: 'ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส',
        mpoint: 'Vibration mm/s',
      }),
    ).toBe('current_3phase')
  })

  it('returns none when no keywords', () => {
    expect(inferPmMeasurementKind({ pmlist: 'Clean filter' })).toBe('none')
  })
})
