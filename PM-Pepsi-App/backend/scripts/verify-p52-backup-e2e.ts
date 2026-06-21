/**
 * P5.2 — Backup verify (settings → manual pg_dump → file on disk + history).
 *
 * Usage:
 *   npx tsx scripts/verify-p52-backup-e2e.ts
 *
 * Optional env:
 *   PG_DUMP_PATH — path to pg_dump (auto-detected on Windows if unset)
 *   BACKUP_VERIFY_SKIP_RUN=1 — settings/history only, skip manual backup
 */
import 'dotenv/config'
import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { constants } from 'node:fs'
import { createPool } from '../src/db/pool.js'
import {
  getBackupSettings,
  getLastSuccessfulBackup,
  runBackupJob,
} from '../src/services/admin-backup.js'
import { cronMatchesNow, isPgDumpAvailable, resolvePgDumpBin } from '../src/services/pg-dump-backup.js'

const DEFAULT_TARGET = 'D:/PM-Pepsi-App/backup'
const DEFAULT_CRON = '0 2 * * *'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const results: Array<{ step: string; ok: boolean; detail?: string }> = []

function log(step: string, ok: boolean, detail = '') {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${step}${detail ? ` — ${detail}` : ''}`)
  results.push({ step, ok, detail })
}

function warn(step: string, detail: string) {
  console.log(`[WARN] ${step} — ${detail}`)
  results.push({ step, ok: true, detail: `WARN: ${detail}` })
}

async function ensurePgDumpPath(): Promise<void> {
  if (process.env.PG_DUMP_PATH?.trim()) return
  if (process.platform !== 'win32') return
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\11\\bin\\pg_dump.exe',
  ]
  for (const p of candidates) {
    try {
      await access(p, constants.F_OK)
      process.env.PG_DUMP_PATH = p
      return
    } catch {
      /* try next */
    }
  }
}

const pool = createPool(databaseUrl)

try {
  await ensurePgDumpPath()

  const settings = await getBackupSettings(pool)
  log(
    'Backup target_dir',
    settings.targetDir.replace(/\\/g, '/') === DEFAULT_TARGET,
    settings.targetDir,
  )
  log(
    'Backup schedule_cron',
    settings.scheduleCron === DEFAULT_CRON,
    settings.scheduleCron,
  )
  log(
    'Backup retention_days',
    settings.retentionDays >= 7,
    String(settings.retentionDays),
  )

  // Scheduler uses minute/hour match — verify cron shape (not "run now")
  const cronShapeOk = /^\d{1,2}\s+\d{1,2}\s+\*\s+\*\s+\*$/.test(settings.scheduleCron.trim())
  log('Cron format (M H * * *)', cronShapeOk, settings.scheduleCron)

  const targetResolved = path.resolve(settings.targetDir)
  try {
    await mkdir(targetResolved, { recursive: true })
    log('Target directory writable', true, targetResolved)
  } catch (err) {
    log(
      'Target directory writable',
      false,
      err instanceof Error ? err.message : String(err),
    )
  }

  const pgOk = await isPgDumpAvailable()
  log('pg_dump available', pgOk, pgOk ? resolvePgDumpBin() : 'set PG_DUMP_PATH in .env')

  const skipRun = process.env.BACKUP_VERIFY_SKIP_RUN === '1'
  if (!pgOk) {
    warn('Manual backup', 'skipped — pg_dump not in PATH')
  } else if (skipRun) {
    warn('Manual backup', 'skipped — BACKUP_VERIFY_SKIP_RUN=1')
  } else {
    const item = await runBackupJob(pool, {
      trigger: 'manual',
      startedBy: 'verify-p52',
      databaseUrl,
    })
    const success = item.status === 'success'
    log(
      'Manual backup job',
      success,
      success
        ? `id=${item.id} size=${item.sizeBytes ?? 0}B duration=${item.durationMs ?? 0}ms`
        : item.errorText ?? 'failed',
    )

    if (success && item.filePath) {
      try {
        await access(item.filePath, constants.F_OK)
        log('Backup file on disk', true, item.filePath)
      } catch {
        log('Backup file on disk', false, item.filePath)
      }
      if (item.sha256) {
        log('Backup SHA256 recorded', true, item.sha256.slice(0, 16) + '…')
      } else {
        log('Backup SHA256 recorded', false)
      }
    }

    const last = await getLastSuccessfulBackup(pool)
    log(
      'Last successful backup in history',
      last?.status === 'success',
      last ? `#${last.id} ${last.finishedAt ?? ''}` : 'none',
    )
  }

  // API smoke (optional — backend may be down)
  const apiBase = process.env.APP_PUBLIC_URL?.trim() || 'http://127.0.0.1:4000'
  try {
    const res = await fetch(`${apiBase}/api/v1/admin/backup/schedule`, {
      headers: { Cookie: '' },
    })
    if (res.status === 401 || res.status === 403) {
      warn('GET /admin/backup/schedule', `auth required (${res.status}) — OK if API up`)
    } else {
      log('GET /admin/backup/schedule', res.ok, `status=${res.status}`)
    }
  } catch (err) {
    warn('GET /admin/backup/schedule', err instanceof Error ? err.message : String(err))
  }

  // Sanity: cron should NOT fire every minute
  const wouldFireNow = cronMatchesNow(settings.scheduleCron)
  if (wouldFireNow) {
    warn('Cron matches now', 'scheduler may run on this minute — expected at 02:00 only')
  }
} catch (err) {
  log('P5.2 backup E2E', false, err instanceof Error ? err.message : String(err))
} finally {
  await pool.end()
}

const failed = results.filter((r) => !r.ok)
const critical = failed.filter(
  (r) =>
    !r.detail?.startsWith('WARN:') &&
    !r.step.includes('GET /admin/backup/schedule'),
)
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed (${critical.length} critical fail)`)
if (critical.length > 0) process.exit(1)
