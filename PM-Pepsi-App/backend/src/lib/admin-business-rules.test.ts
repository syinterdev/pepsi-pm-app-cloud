import { describe, expect, it } from 'vitest'
import { restoreConfirmBodySchema } from '../schemas/admin-backup.js'
import {
  isMaintenanceExemptPath,
  isMutatingMethod,
  MAINTENANCE_BYPASS_PERMISSIONS,
} from '../services/maintenance-mode.js'

describe('§3.3 maintenance helpers', () => {
  it('treats POST/PUT/PATCH/DELETE as mutating', () => {
    expect(isMutatingMethod('POST')).toBe(true)
    expect(isMutatingMethod('patch')).toBe(true)
    expect(isMutatingMethod('GET')).toBe(false)
  })

  it('exempts auth login/logout from maintenance block', () => {
    expect(isMaintenanceExemptPath('/api/v1/auth/login')).toBe(true)
    expect(isMaintenanceExemptPath('/api/v1/auth/logout')).toBe(true)
    expect(isMaintenanceExemptPath('/api/v1/planning/assign')).toBe(false)
  })

  it('lists admin bypass permissions for maintenance', () => {
    expect(MAINTENANCE_BYPASS_PERMISSIONS).toContain('admin.settings.write')
    expect(MAINTENANCE_BYPASS_PERMISSIONS).toContain('admin.backup.restore')
  })
})

describe('§3.3 restore confirm', () => {
  it('requires confirmPhrase RESTORE', () => {
    expect(restoreConfirmBodySchema.safeParse({ confirmPhrase: 'RESTORE' }).success).toBe(true)
    expect(restoreConfirmBodySchema.safeParse({ confirmPhrase: 'restore' }).success).toBe(false)
    expect(restoreConfirmBodySchema.safeParse({}).success).toBe(false)
  })
})
