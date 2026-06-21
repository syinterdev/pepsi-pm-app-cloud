import type { Pool } from 'pg'
import { hasPermission } from './has-permission.js'

export type ConfirmationExportScope = 'ALL' | 'OWN'

/** Scope สำหรับ export confirmation — จาก `confirmation.export.all` ใน tbl_role_permission */
export async function resolveConfirmationExportScope(
  pool: Pool,
  userst: string | null | undefined,
): Promise<ConfirmationExportScope> {
  const exportAll = await hasPermission(pool, userst, 'confirmation.export.all')
  return exportAll ? 'ALL' : 'OWN'
}
