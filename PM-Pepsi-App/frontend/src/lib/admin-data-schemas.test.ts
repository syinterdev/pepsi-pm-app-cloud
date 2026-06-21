import { describe, expect, it } from 'vitest'
import {
  adminRoleSchema,
  adminSettingsResponseSchema,
  announcementItemSchema,
  auditLogItemSchema,
  backupHistoryItemSchema,
  userPrefSchema,
} from '@/api/schemas'

const ADMIN_DATA_TABLES = [
  'tbl_role',
  'tbl_permission',
  'tbl_role_permission',
  'tbl_setting',
  'tbl_audit_log',
  'tbl_backup_history',
  'tbl_announcement',
  'tbl_user_pref',
] as const

describe('§3.2 admin data — Zod contracts (frontend)', () => {
  it('tracks 8 PostgreSQL tables', () => {
    expect(ADMIN_DATA_TABLES).toHaveLength(8)
  })

  it('parses representative API payloads', () => {
    adminRoleSchema.parse({
      roleCode: 'H',
      roleName: 'ผู้จัดการ / หัวหน้างาน',
      roleNameEn: 'Manager',
      roleColor: '#4DA6FF',
      isSystem: true,
      description: null,
      userCount: 0,
      permissionCount: 10,
    })
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
      featureDashboardCharts: true,
      maintenanceEnabled: false,
      maintenanceMessage: '',
    })
    auditLogItemSchema.parse({
      id: 2,
      actorId: null,
      actorRole: null,
      action: 'rbac.deny',
      resource: 'rbac',
      resourceId: null,
      before: null,
      after: null,
      ip: null,
      userAgent: null,
      status: 'denied',
      message: 'admin.backup.read',
      createdAt: new Date().toISOString(),
    })
    backupHistoryItemSchema.parse({
      id: 3,
      trigger: 'schedule',
      status: 'running',
      sizeBytes: null,
      filePath: null,
      sha256: null,
      durationMs: null,
      startedBy: 'system',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      errorText: null,
    })
    announcementItemSchema.parse({
      id: 4,
      level: 'warn',
      title: 'แจ้งเตือน',
      body: 'ข้อความ',
      startsAt: new Date().toISOString(),
      endsAt: null,
      dismissable: true,
      active: true,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    })
    userPrefSchema.parse({
      userId: 'M001',
      themeMode: 'dark',
      language: 'th-TH',
      density: 'compact',
      seenTours: { admin: true },
      updatedAt: new Date().toISOString(),
    })
  })
})
