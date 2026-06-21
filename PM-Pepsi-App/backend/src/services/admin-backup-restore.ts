import { unlink } from 'node:fs/promises'
import type { Pool } from 'pg'
import { withBackupAdvisoryLock } from '../lib/backup-lock.js'
import { clearMaintenanceCache } from './maintenance-mode.js'
import { runPsqlFromGzipFile } from './pg-dump-backup.js'
import { upsertSetting } from './setting-store.js'

const RESTORE_MAINTENANCE_MSG =
  'ระบบกำลังกู้คืนฐานข้อมูล — กรุณารอจนกว่าจะเสร็จ (โหมดบำรุงรักษา)'

export async function runRestoreFromGzipFile(
  pool: Pool,
  databaseUrl: string,
  gzipPath: string,
  startedBy: string,
  opts?: { deleteFileAfter?: boolean },
): Promise<{ durationMs: number }> {
  return withBackupAdvisoryLock(pool, async () => {
    const started = Date.now()
    let maintenanceWasOn = false

    try {
      const { rows } = await pool.query<{ v: unknown }>(
        `SELECT setting_value AS v FROM app.tbl_setting WHERE setting_key = 'maintenance.enabled'`,
      )
      const raw = rows[0]?.v
      maintenanceWasOn =
        raw === true || raw === 'true' || (typeof raw === 'string' && raw === 'true')

      await upsertSetting(pool, 'maintenance.enabled', true, 'system', startedBy)
      await upsertSetting(pool, 'maintenance.message', RESTORE_MAINTENANCE_MSG, 'system', startedBy)
      clearMaintenanceCache()

      await runPsqlFromGzipFile(databaseUrl, gzipPath)

      return { durationMs: Date.now() - started }
    } finally {
      if (!maintenanceWasOn) {
        await upsertSetting(pool, 'maintenance.enabled', false, 'system', startedBy)
        await upsertSetting(pool, 'maintenance.message', '', 'system', startedBy)
        clearMaintenanceCache()
      }
      if (opts?.deleteFileAfter) {
        try {
          await unlink(gzipPath)
        } catch {
          /* temp upload */
        }
      }
    }
  })
}
