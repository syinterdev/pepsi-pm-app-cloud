/**
 * §3.2 Data — admin module PostgreSQL tables and primary Zod schema modules.
 * Used by health probes, docs, and schema contract tests.
 */
export const ADMIN_DATA_TABLES = [
  {
    table: 'tbl_role',
    migration: '044_tbl_role.sql',
    backendSchemas: ['schemas/admin-roles.ts'],
    frontendSchemas: ['adminRoleSchema', 'adminRolesListResponseSchema'],
  },
  {
    table: 'tbl_permission',
    migration: '045_tbl_permission.sql',
    backendSchemas: ['schemas/admin-roles.ts'],
    frontendSchemas: ['adminPermissionSchema', 'adminPermissionsResponseSchema'],
  },
  {
    table: 'tbl_role_permission',
    migration: '046_tbl_role_permission.sql',
    backendSchemas: ['schemas/admin-roles.ts'],
    frontendSchemas: ['adminRoleMatrixResponseSchema', 'setRolePermissionsBodySchema'],
  },
  {
    table: 'tbl_setting',
    migration: '047_tbl_setting.sql',
    backendSchemas: ['schemas/admin-settings.ts', 'schemas/admin-branding.ts', 'schemas/settings.ts'],
    frontendSchemas: ['adminSettingsResponseSchema', 'publicSettingsSchema'],
  },
  {
    table: 'tbl_audit_log',
    migration: '050_tbl_audit_log.sql',
    backendSchemas: ['schemas/admin-audit.ts', 'schemas/audit-log.ts'],
    frontendSchemas: ['auditLogItemSchema', 'auditListResponseSchema'],
  },
  {
    table: 'tbl_backup_history',
    migration: '062_tbl_backup_history.sql',
    backendSchemas: ['schemas/admin-backup.ts'],
    frontendSchemas: ['backupHistoryItemSchema', 'backupListResponseSchema'],
  },
  {
    table: 'tbl_announcement',
    migration: '064_tbl_announcement.sql',
    backendSchemas: ['schemas/admin-announcement.ts'],
    frontendSchemas: ['announcementItemSchema', 'announcementListResponseSchema'],
  },
  {
    table: 'tbl_user_pref',
    migration: '068_tbl_user_pref.sql',
    backendSchemas: ['schemas/user-pref.ts'],
    frontendSchemas: ['userPrefSchema', 'patchUserPrefBodySchema'],
  },
] as const

export const ADMIN_DATA_TABLE_NAMES = ADMIN_DATA_TABLES.map((t) => t.table)
