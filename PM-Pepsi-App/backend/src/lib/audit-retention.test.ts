import { describe, expect, it } from 'vitest'
import { auditRetentionCutoffDate, DEFAULT_AUDIT_RETENTION_DAYS } from './audit-retention.js'

describe('audit-retention', () => {
  it('cutoff is retentionDays before today (UTC date)', () => {
    const now = new Date('2026-05-22T12:00:00.000Z')
    const cutoff = auditRetentionCutoffDate(DEFAULT_AUDIT_RETENTION_DAYS, now)
    expect(cutoff).toBe('2025-05-22')
  })
})
