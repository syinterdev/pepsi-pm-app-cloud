export * from '@/lib/admin-about-api'
export * from '@/lib/admin-announcement-api'
export * from '@/lib/admin-audit-api'
export * from '@/lib/admin-branding-api'
export * from '@/lib/admin-menu-api'
export * from '@/lib/admin-roles-api'
export * from '@/lib/admin-security-api'
export * from '@/lib/admin-settings-api'
export * from '@/lib/admin-users-api'

// admin-backup-api (exported explicitly to avoid `formatBytes` collision)
export {
  deleteBackup,
  downloadBackup,
  fetchBackupList,
  fetchBackupSchedule,
  patchBackupSchedule,
  restoreBackupFromHistory,
  restoreBackupUpload,
  startBackupNow,
} from '@/lib/admin-backup-api'
export { formatBytes as formatBackupBytes } from '@/lib/admin-backup-api'

// admin-health-api (exported explicitly to avoid `formatBytes` collision)
export { fetchAdminHealth, formatUptime, HEALTH_POLL_MS } from '@/lib/admin-health-api'
export { formatBytes as formatHealthBytes } from '@/lib/admin-health-api'

