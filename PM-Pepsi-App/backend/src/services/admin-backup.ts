import { stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import type { Pool } from 'pg'
import type {
  BackupHistoryItem,
  BackupListQuery,
} from '../schemas/admin-backup.js'
import { withBackupAdvisoryLock } from '../lib/backup-lock.js'
import {
  cronMatchesNow,
  formatBackupFilename,
  isPgDumpAvailable,
  runPgDumpToGzipFile,
  sha256File,
} from './pg-dump-backup.js'
import {
  fetchSettings,
  settingAsNumber,
  settingAsString,
} from './setting-store.js'

const BACKUP_KEYS = [
  'backup.schedule_cron',
  'backup.retention_days',
  'backup.target_dir',
] as const

const DEFAULT_SCHEDULE = '0 2 * * *'
const DEFAULT_RETENTION = 30
const DEFAULT_TARGET = 'D:/PM-Pepsi-App/backup'

export function isBackupTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_backup_history') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

type BackupRow = {
  id: string
  trigger: string
  status: string
  size_bytes: string | null
  file_path: string | null
  sha256: string | null
  duration_ms: number | null
  started_by: string | null
  started_at: Date
  finished_at: Date | null
  error_text: string | null
}

function mapRow(row: BackupRow): BackupHistoryItem {
  return {
    id: Number(row.id),
    trigger: row.trigger as BackupHistoryItem['trigger'],
    status: row.status as BackupHistoryItem['status'],
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    filePath: row.file_path,
    sha256: row.sha256,
    durationMs: row.duration_ms,
    startedBy: row.started_by,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
    errorText: row.error_text,
  }
}

export async function getBackupSettings(pool: Pool) {
  const map = await fetchSettings(pool, BACKUP_KEYS)
  const cronRaw = map.get('backup.schedule_cron')
  const dirRaw = map.get('backup.target_dir')
  return {
    scheduleCron: settingAsString(cronRaw) ?? DEFAULT_SCHEDULE,
    retentionDays: settingAsNumber(map.get('backup.retention_days'), DEFAULT_RETENTION),
    targetDir: settingAsString(dirRaw) ?? DEFAULT_TARGET,
  }
}

export async function patchBackupSettings(
  pool: Pool,
  body: { scheduleCron?: string; retentionDays?: number; targetDir?: string },
  updatedBy?: string | null,
): Promise<void> {
  const { upsertSetting } = await import('./setting-store.js')
  if (body.scheduleCron !== undefined) {
    await upsertSetting(pool, 'backup.schedule_cron', body.scheduleCron, 'backup', updatedBy)
  }
  if (body.retentionDays !== undefined) {
    await upsertSetting(pool, 'backup.retention_days', body.retentionDays, 'backup', updatedBy)
  }
  if (body.targetDir !== undefined) {
    await upsertSetting(pool, 'backup.target_dir', body.targetDir, 'backup', updatedBy)
  }
}

export async function listBackupHistory(
  pool: Pool,
  query: BackupListQuery,
): Promise<{ items: BackupHistoryItem[]; total: number }> {
  const limit = query.limit ?? 50
  const offset = query.offset ?? 0
  const countQ = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app.tbl_backup_history`,
  )
  const total = Number(countQ.rows[0]?.count ?? 0)
  const { rows } = await pool.query<BackupRow>(
    `SELECT id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
            started_by, started_at, finished_at, error_text
     FROM app.tbl_backup_history
     ORDER BY started_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
  return { items: rows.map(mapRow), total }
}

export async function getBackupById(pool: Pool, id: number): Promise<BackupHistoryItem | null> {
  const { rows } = await pool.query<BackupRow>(
    `SELECT id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
            started_by, started_at, finished_at, error_text
     FROM app.tbl_backup_history WHERE id = $1`,
    [id],
  )
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function getLastSuccessfulBackup(
  pool: Pool,
): Promise<BackupHistoryItem | null> {
  const { rows } = await pool.query<BackupRow>(
    `SELECT id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
            started_by, started_at, finished_at, error_text
     FROM app.tbl_backup_history
     WHERE status = 'success'
     ORDER BY finished_at DESC NULLS LAST
     LIMIT 1`,
  )
  return rows[0] ? mapRow(rows[0]) : null
}

async function hasRunningBackup(pool: Pool): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM app.tbl_backup_history WHERE status = 'running'
     ) AS ok`,
  )
  return Boolean(rows[0]?.ok)
}

async function markBackupFinished(
  pool: Pool,
  id: number,
  patch: {
    status: 'success' | 'failed'
    sizeBytes?: number | null
    filePath?: string | null
    sha256?: string | null
    durationMs: number
    errorText?: string | null
  },
): Promise<BackupHistoryItem> {
  const { rows } = await pool.query<BackupRow>(
    `UPDATE app.tbl_backup_history
     SET status = $2,
         size_bytes = $3,
         file_path = $4,
         sha256 = $5,
         duration_ms = $6,
         finished_at = now(),
         error_text = $7
     WHERE id = $1
     RETURNING id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
               started_by, started_at, finished_at, error_text`,
    [
      id,
      patch.status,
      patch.sizeBytes ?? null,
      patch.filePath ?? null,
      patch.sha256 ?? null,
      patch.durationMs,
      patch.errorText ?? null,
    ],
  )
  return mapRow(rows[0]!)
}

export async function runBackupJob(
  pool: Pool,
  opts: {
    trigger: 'manual' | 'schedule'
    startedBy: string | null
    databaseUrl: string
  },
): Promise<BackupHistoryItem> {
  return withBackupAdvisoryLock(pool, async () => {
    if (await hasRunningBackup(pool)) {
      throw new Error('BACKUP_ALREADY_RUNNING')
    }

    return runBackupJobLocked(pool, opts)
  })
}

async function runBackupJobLocked(
  pool: Pool,
  opts: {
    trigger: 'manual' | 'schedule'
    startedBy: string | null
    databaseUrl: string
  },
): Promise<BackupHistoryItem> {
  const settings = await getBackupSettings(pool)
  const targetDir = path.resolve(settings.targetDir)
  const fileName = formatBackupFilename()
  const filePath = path.join(targetDir, fileName)

  const insert = await pool.query<BackupRow>(
    `INSERT INTO app.tbl_backup_history ("trigger", status, started_by, file_path)
     VALUES ($1, 'running', $2, $3)
     RETURNING id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
               started_by, started_at, finished_at, error_text`,
    [opts.trigger, opts.startedBy, filePath],
  )
  const row = mapRow(insert.rows[0]!)
  const started = Date.now()

  try {
    await runPgDumpToGzipFile(opts.databaseUrl, filePath)
    const st = await stat(filePath)
    const sha256 = await sha256File(filePath)
    const finished = await markBackupFinished(pool, row.id, {
      status: 'success',
      sizeBytes: st.size,
      filePath,
      sha256,
      durationMs: Date.now() - started,
    })
    await purgeOldBackups(pool, settings.retentionDays)
    return finished
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    try {
      await unlink(filePath)
    } catch {
      /* partial file */
    }
    return markBackupFinished(pool, row.id, {
      status: 'failed',
      sizeBytes: null,
      filePath: null,
      sha256: null,
      durationMs: Date.now() - started,
      errorText: message,
    })
  }
}

export async function deleteBackupRecord(pool: Pool, id: number): Promise<boolean> {
  const item = await getBackupById(pool, id)
  if (!item) return false
  if (item.filePath) {
    try {
      await unlink(item.filePath)
    } catch {
      /* already gone */
    }
  }
  await pool.query(`DELETE FROM app.tbl_backup_history WHERE id = $1`, [id])
  return true
}

export async function purgeOldBackups(pool: Pool, retentionDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const { rows } = await pool.query<BackupRow>(
    `SELECT id, "trigger", status, size_bytes, file_path, sha256, duration_ms,
            started_by, started_at, finished_at, error_text
     FROM app.tbl_backup_history
     WHERE started_at < $1`,
    [cutoff],
  )
  let deleted = 0
  for (const row of rows) {
    const ok = await deleteBackupRecord(pool, Number(row.id))
    if (ok) deleted += 1
  }
  return deleted
}

let lastScheduledSlot: string | null = null

export function startBackupScheduler(pool: Pool, databaseUrl: string): void {
  const tick = async () => {
    try {
      const settings = await getBackupSettings(pool)
      if (!cronMatchesNow(settings.scheduleCron)) return

      const slot = `${new Date().toISOString().slice(0, 16)}`
      if (lastScheduledSlot === slot) return
      lastScheduledSlot = slot

      if (!(await isPgDumpAvailable())) return
      if (await hasRunningBackup(pool)) return

      await runBackupJob(pool, {
        trigger: 'schedule',
        startedBy: 'schedule',
        databaseUrl,
      })
    } catch (err) {
      console.error('[backup-scheduler]', err)
    }
  }

  void tick()
  setInterval(() => void tick(), 60_000)
}

export { isPgDumpAvailable, cronMatchesNow }
