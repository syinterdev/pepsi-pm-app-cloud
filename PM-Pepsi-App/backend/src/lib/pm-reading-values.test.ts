import { describe, expect, it } from 'vitest'
import { mapPmReadingV3FromDb, normalizePmReadingV3ForWrite } from './pm-reading-values.js'

describe('normalizePmReadingV3ForWrite', () => {
  it('vibration always stores null v3', () => {
    expect(normalizePmReadingV3ForWrite('vibration_dst_db', 0)).toBeNull()
    expect(normalizePmReadingV3ForWrite('vibration_dst_db', 5)).toBeNull()
    expect(normalizePmReadingV3ForWrite('vibration_dst_db', null)).toBeNull()
  })

  it('current requires finite v3', () => {
    expect(normalizePmReadingV3ForWrite('current_3phase', 96.2)).toBe(96.2)
    expect(() => normalizePmReadingV3ForWrite('current_3phase', null)).toThrow('V3_REQUIRED')
  })
})

describe('mapPmReadingV3FromDb', () => {
  it('vibration null or zero → null', () => {
    expect(mapPmReadingV3FromDb('vibration_dst_db', null)).toBeNull()
    expect(mapPmReadingV3FromDb('vibration_dst_db', '0')).toBeNull()
    expect(mapPmReadingV3FromDb('vibration_dst_db', 8)).toBe(8)
  })

  it('current keeps numeric v3', () => {
    expect(mapPmReadingV3FromDb('current_3phase', '96.2')).toBe(96.2)
  })
})
