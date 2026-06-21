import type { Pool } from 'pg'
import { vi } from 'vitest'
import type { AuthUser } from '../schemas/auth.js'
import { signSessionToken } from '../lib/session-token.js'

export const TEST_SESSION_SECRET = 'test-session-secret-16chars'

export function testAuthUser(userst: string): AuthUser {
  return {
    idwkctr: 'ADMIN01',
    username: 'admin01',
    wkctr: 'ADMIN01',
    userst,
    sysstatus: 'ACTIVE',
    accountType: 'workcenter',
    fullnameTh: 'Admin Test',
  }
}

export function authBearer(userst: string): string {
  return `Bearer ${signSessionToken(testAuthUser(userst), TEST_SESSION_SECRET)}`
}

/** Pool that triggers legacy RBAC fallback (role A = all permissions). */
export function legacyRbacPool(): Pool {
  return {
    query: vi.fn(async (sql: string) => {
      const s = String(sql)
      if (
        s.includes('tbl_role_permission') ||
        s.includes('tbl_permission') ||
        s.includes('tbl_role')
      ) {
        throw new Error('relation "tbl_role_permission" does not exist')
      }
      return { rows: [] }
    }),
  } as unknown as Pool
}
