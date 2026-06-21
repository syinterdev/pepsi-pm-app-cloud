import { describe, expect, it } from 'vitest'
import {
  finalizeSystemStatusFilterOptions,
  formatSystemStatusFilterLabel,
  TECO_STATUS_FILTER_OPTION,
} from './system-status-filter.js'

describe('system-status-filter', () => {
  it('formats label with wkstreason', () => {
    expect(formatSystemStatusFilterLabel('CRTD', 'Created')).toBe('CRTD = Created')
    expect(formatSystemStatusFilterLabel('REL', null)).toBe('REL')
  })

  it('adds TECO when missing and excludes MOVE OVER', () => {
    const out = finalizeSystemStatusFilterOptions([
      { code: 'REL', label: 'REL = Released' },
      { code: 'CRTD', label: 'CRTD = Created' },
      { code: 'MOVE OVER', label: 'MOVE OVER = moved' },
    ])
    expect(out.map((o) => o.code)).toEqual(['CRTD', 'REL', 'TECO'])
    expect(out.find((o) => o.code === 'TECO')).toEqual(TECO_STATUS_FILTER_OPTION)
  })

  it('keeps existing TECO from database', () => {
    const custom = { code: 'TECO', label: 'TECO = custom' }
    const out = finalizeSystemStatusFilterOptions([custom])
    expect(out).toEqual([custom])
  })
})
