import path from 'node:path'
import type { Pool } from 'pg'
import type { HealthMigrateResult } from '../schemas/admin-health.js'
import { getMaintenanceState } from './maintenance-mode.js'
import {
  getMigrationHealth,
  resolveMigrationsDir,
} from './admin-health.js'
import { isPsqlAvailable, runPsqlSqlFile } from './pg-dump-backup.js'

export class HealthMigrateError extends Error {
  constructor(
    message: string,
    readonly code: 'MAINTENANCE_REQUIRED' | 'PSQL_UNAVAILABLE' | 'NO_DIR' | 'NO_PENDING',
  ) {
    super(message)
    this.name = 'HealthMigrateError'
  }
}

export async function runPendingMigrations(
  pool: Pool,
  databaseUrl: string,
): Promise<HealthMigrateResult> {
  const { enabled } = await getMaintenanceState(pool)
  if (!enabled) {
    throw new HealthMigrateError(
      'เปิด maintenance mode ก่อนรัน migration (Admin → Settings หรือ Announcements)',
      'MAINTENANCE_REQUIRED',
    )
  }

  const migrationsDir = resolveMigrationsDir()
  if (!migrationsDir) {
    throw new HealthMigrateError('ไม่พบโฟลเดอร์ database/migrations บนเซิร์ฟเวอร์ API', 'NO_DIR')
  }

  if (!(await isPsqlAvailable())) {
    throw new HealthMigrateError('ไม่พบ psql ใน PATH — ตั้ง PSQL_PATH', 'PSQL_UNAVAILABLE')
  }

  const migration = await getMigrationHealth(pool)
  const pending = migration.probes
    .filter((p) => p.status === 'pending')
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

  if (pending.length === 0) {
    throw new HealthMigrateError('ไม่มี migration ที่ติดตามและยัง pending', 'NO_PENDING')
  }

  const applied: HealthMigrateResult['applied'] = []
  let stoppedAt: HealthMigrateResult['stoppedAt'] = null

  for (const probe of pending) {
    const filePath = path.join(migrationsDir, probe.file)
    try {
      await runPsqlSqlFile(databaseUrl, filePath)
      applied.push({ id: probe.id, file: probe.file, label: probe.label })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      stoppedAt = { file: probe.file, message }
      break
    }
  }

  const after = await getMigrationHealth(pool)

  return {
    applied,
    pendingRemaining: after.pendingCount,
    stoppedAt,
  }
}
