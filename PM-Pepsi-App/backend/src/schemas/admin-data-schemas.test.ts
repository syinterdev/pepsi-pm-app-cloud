import { describe, expect, it } from 'vitest'
import { ADMIN_DATA_TABLE_NAMES } from '../lib/admin-data-tables.js'
import { adminRoleSchema } from './admin-roles.js'
import { announcementItemSchema } from './admin-announcement.js'
import { backupHistoryItemSchema } from './admin-backup.js'
import { auditLogItemSchema } from './admin-audit.js'
import { adminSettingsResponseSchema } from './admin-settings.js'
import { userPrefSchema } from './user-pref.js'

describe('§3.2 admin data — Zod contracts (backend)', () => {
  it('lists 8 admin tables', () => {
    expect(ADMIN_DATA_TABLE_NAMES).toEqual([
      'tbl_role',
      'tbl_permission',
      'tbl_role_permission',
      'tbl_setting',
      'tbl_audit_log',
      'tbl_backup_history',
      'tbl_announcement',
      'tbl_user_pref',
    ])
  })

  it('parses tbl_role row shape', () => {
    expect(
      adminRoleSchema.parse({
        roleCode: 'A',
        roleName: 'Admin',
        roleNameEn: 'Administrator',
        roleColor: '#E11D48',
        isSystem: true,
        description: null,
        userCount: 1,
        permissionCount: 66,
      }).roleCode,
    ).toBe('A')
  })

  it('parses tbl_setting response', () => {
    adminSettingsResponseSchema.parse({
      locale: 'th-TH',
      timezone: 'Asia/Bangkok',
      yearFormat: 'BE',
      dateFormat: 'dd/MM/yyyy',
      uploadMaxMb: 15,
      sessionTtlMin: 480,
      passwordMinLength: 12,
      maxLoginAttempts: 5,
      featureIndexeddbOffline: false,
      featureDashboardCharts: false,
      maintenanceEnabled: false,
      maintenanceMessage: '',
    })
  })

  it('parses tbl_audit_log item', () => {
    auditLogItemSchema.parse({
      id: 1,
      actorId: 'u1',
      actorRole: 'A',
      action: 'auth.login',
      resource: 'auth',
      resourceId: 'u1',
      before: null,
      after: null,
      ip: '127.0.0.1',
      userAgent: 'test',
      status: 'ok',
      message: null,
      createdAt: new Date().toISOString(),
    })
  })

  it('parses tbl_backup_history item', () => {
    backupHistoryItemSchema.parse({
      id: 1,
      trigger: 'manual',
      status: 'success',
      sizeBytes: 1024,
      filePath: 'D:/backup/x.sql.gz',
      sha256: 'abc',
      durationMs: 1000,
      startedBy: 'admin',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      errorText: null,
    })
  })

  it('parses tbl_announcement item', () => {
    announcementItemSchema.parse({
      id: 1,
      level: 'info',
      title: 'ทดสอบ',
      body: null,
      startsAt: new Date().toISOString(),
      endsAt: null,
      dismissable: true,
      active: true,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    })
  })

  it('parses tbl_user_pref', () => {
    userPrefSchema.parse({
      userId: 'WC001',
      themeMode: 'system',
      language: 'th-TH',
      density: 'comfortable',
      seenTours: { admin: true },
      updatedAt: new Date().toISOString(),
    })
  })
})
