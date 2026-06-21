import { describe, expect, it } from 'vitest'
import { formatBytes } from './admin-health.js'

describe('admin-health', () => {
  it('formatBytes formats gigabytes', () => {
    expect(formatBytes(5 * 1024 * 1024 * 1024)).toContain('GB')
  })

  it('formatBytes handles null', () => {
    expect(formatBytes(null)).toBe('—')
  })
})
