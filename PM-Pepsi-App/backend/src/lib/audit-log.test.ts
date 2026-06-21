import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { auditLog, auditActorFromUser, isAuditTableMissing } from './audit-log.js'
import { auditLogInputSchema } from '../schemas/audit-log.js'

describe('audit-log schemas', () => {
  it('parses audit input', () => {
    const parsed = auditLogInputSchema.parse({
      action: 'auth.login',
      resource: 'auth',
      status: 'ok',
    })
    expect(parsed.action).toBe('auth.login')
  })
})

describe('isAuditTableMissing', () => {
  it('detects missing relation', () => {
    expect(isAuditTableMissing(new Error('relation "tbl_audit_log" does not exist'))).toBe(true)
    expect(isAuditTableMissing(new Error('other'))).toBe(false)
  })
})

describe('auditActorFromUser', () => {
  it('prefers idwkctr', () => {
    expect(
      auditActorFromUser({ idwkctr: 'WC01', username: 'u', userst: 'A' }),
    ).toEqual({ actorId: 'WC01', actorRole: 'A' })
  })
})

describe('auditLog', () => {
  it('inserts and returns id', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: '42' }] })
    const pool = { query } as unknown as Pool

    const id = await auditLog(pool, { actorId: 'WC01', actorRole: 'A' }, {
      action: 'admin.settings.update',
      resource: 'tbl_setting',
      after: { uploadMaxMb: 20 },
    })

    expect(id).toBe(42)
    expect(query).toHaveBeenCalledOnce()
    const sql = String(query.mock.calls[0][0])
    expect(sql).toContain('INSERT INTO app.tbl_audit_log')
  })

  it('returns null when table missing', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('relation "tbl_audit_log" does not exist')),
    } as unknown as Pool

    const id = await auditLog(pool, { actorId: 'x', actorRole: 'A' }, { action: 'auth.login' })
    expect(id).toBeNull()
  })
})
