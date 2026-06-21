import { describe, expect, it } from 'vitest'
import { cronMatchesNow, formatBackupFilename } from './pg-dump-backup.js'

describe('formatBackupFilename', () => {
  it('uses timestamp pattern', () => {
    const name = formatBackupFilename(new Date('2026-05-20T14:30:00'))
    expect(name).toBe('backup-20260520-1430.sql.gz')
  })
})

describe('cronMatchesNow', () => {
  it('matches minute and hour', () => {
    const d = new Date('2026-05-20T02:00:00')
    expect(cronMatchesNow('0 2 * * *', d)).toBe(true)
    expect(cronMatchesNow('0 3 * * *', d)).toBe(false)
  })
})
