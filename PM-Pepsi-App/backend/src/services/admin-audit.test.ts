import { describe, expect, it } from 'vitest'
import { auditLogsToCsv, defaultAuditFromTo } from './admin-audit.js'

describe('admin-audit service', () => {
  it('defaultAuditFromTo spans ~24h', () => {
    const { from, to } = defaultAuditFromTo()
    const diff = new Date(to).getTime() - new Date(from).getTime()
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000)
  })

  it('auditLogsToCsv escapes commas', () => {
    const csv = auditLogsToCsv([
      {
        id: 1,
        actorId: 'u1',
        actorRole: 'A',
        action: 'auth.login',
        resource: null,
        resourceId: null,
        before: null,
        after: { note: 'hello, world' },
        ip: '127.0.0.1',
        userAgent: null,
        status: 'ok',
        message: null,
        createdAt: '2026-05-19T00:00:00.000Z',
      },
    ])
    expect(csv.split('\n')).toHaveLength(2)
    expect(csv).toContain('"hello, world"')
  })
})
