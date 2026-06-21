import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Pool } from 'pg'
import type { AdminHealthResponse, HealthStatus } from '../schemas/admin-health.js'

type DiskHealth = AdminHealthResponse['disk']

/** Key migrations → existence probe in PostgreSQL */
const MIGRATION_PROBES: Record<string, { label: string; sql: string }> = {
  '001_init_auth_tables.sql': {
    label: 'Auth / tbworkcenter',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbworkcenter'
    ) AS ok`,
  },
  '044_tbl_role.sql': {
    label: 'RBAC tbl_role',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_role'
    ) AS ok`,
  },
  '045_tbl_permission.sql': {
    label: 'RBAC tbl_permission',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_permission'
    ) AS ok`,
  },
  '046_tbl_role_permission.sql': {
    label: 'RBAC tbl_role_permission',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_role_permission'
    ) AS ok`,
  },
  '047_tbl_setting.sql': {
    label: 'System tbl_setting',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_setting'
    ) AS ok`,
  },
  '050_tbl_audit_log.sql': {
    label: 'Audit tbl_audit_log',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_audit_log'
    ) AS ok`,
  },
  '062_tbl_backup_history.sql': {
    label: 'Backup tbl_backup_history',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_backup_history'
    ) AS ok`,
  },
  '064_tbl_announcement.sql': {
    label: 'Announcements tbl_announcement',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_announcement'
    ) AS ok`,
  },
  '068_tbl_user_pref.sql': {
    label: 'User pref tbl_user_pref',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_user_pref'
    ) AS ok`,
  },
  '072_tbl_blocked_ip.sql': {
    label: 'Block IP tbl_blocked_ip',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_blocked_ip'
    ) AS ok`,
  },
  '026_confirmation_tables.sql': {
    label: 'Confirmation tbcofirm',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbcofirm'
    ) AS ok`,
  },
  '007_tbplangingwork_view_planwork.sql': {
    label: 'Planning view_planwork',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'app' AND table_name = 'view_planwork'
    ) AS ok`,
  },
  '099_telegram_notify.sql': {
    label: 'Telegram notify + ack_status',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'tbplangingwork' AND column_name = 'ack_status'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_telegram_notify_group'
    ) AS ok`,
  },
  '100_telegram_link_token.sql': {
    label: 'Telegram link token',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'tbl_telegram_link_token'
    ) AS ok`,
  },
}

function migrationIdFromFile(file: string): string {
  const m = /^(\d{3})_/.exec(file)
  return m?.[1] ?? file
}

export function resolveMigrationsDir(): string | null {
  const env = process.env.MIGRATIONS_DIR?.trim()
  if (env && fs.existsSync(env)) return path.resolve(env)

  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.resolve(here, '../../../../database/migrations'),
    path.resolve(process.cwd(), '../../database/migrations'),
    path.resolve(process.cwd(), '../database/migrations'),
    path.resolve(process.cwd(), 'database/migrations'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

export function listMigrationFiles(dir: string | null): string[] {
  if (!dir) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export async function pingDatabase(pool: Pool): Promise<{
  status: HealthStatus
  latencyMs: number | null
  message?: string
}> {
  const start = performance.now()
  try {
    const r = await pool.query('SELECT 1 AS ok')
    const latencyMs = Math.round(performance.now() - start)
    if (r.rows[0]?.ok == 1) return { status: 'ok', latencyMs }
    return { status: 'error', latencyMs, message: 'Unexpected ping result' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', latencyMs: null, message }
  }
}

export function getPoolStats(pool: Pool): { total: number; idle: number; waiting: number } {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  }
}

export function getDiskHealth(drivePath?: string): DiskHealth {
  const raw = drivePath?.trim() || process.env.HEALTH_DISK_PATH?.trim() || 'D:\\'
  const normalized = raw.endsWith('\\') || raw.endsWith('/') ? raw : `${raw}\\`

  try {
    const stats = fs.statfsSync(normalized)
    const totalBytes = Number(stats.blocks) * Number(stats.bsize)
    const freeBytes = Number(stats.bfree) * Number(stats.bsize)
    const usedBytes = totalBytes - freeBytes
    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : null

    let status: HealthStatus = 'ok'
    if (usedPercent != null && usedPercent >= 95) status = 'error'
    else if (usedPercent != null && usedPercent >= 85) status = 'warning'

    return {
      status,
      path: normalized,
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      status: 'unknown',
      path: normalized,
      totalBytes: null,
      freeBytes: null,
      usedBytes: null,
      usedPercent: null,
      message,
    }
  }
}

export async function getMigrationHealth(pool: Pool): Promise<AdminHealthResponse['migration']> {
  const migrationsDir = resolveMigrationsDir()
  const files = listMigrationFiles(migrationsDir)
  return runMigrationProbes(pool, files)
}

async function runMigrationProbes(
  pool: Pool,
  files: string[],
): Promise<AdminHealthResponse['migration']> {
  const probes: AdminHealthResponse['migration']['probes'] = []
  let appliedCount = 0
  let pendingCount = 0
  let unverifiedCount = 0

  for (const file of files) {
    const probe = MIGRATION_PROBES[file]
    const id = migrationIdFromFile(file)
    if (!probe) {
      unverifiedCount += 1
      probes.push({ id, file, label: file, status: 'unverified' })
      continue
    }
    try {
      const { rows } = await pool.query<{ ok: boolean }>(probe.sql)
      const ok = rows[0]?.ok === true
      if (ok) {
        appliedCount += 1
        probes.push({ id, file, label: probe.label, status: 'applied' })
      } else {
        pendingCount += 1
        probes.push({ id, file, label: probe.label, status: 'pending' })
      }
    } catch {
      pendingCount += 1
      probes.push({ id, file, label: probe.label, status: 'pending' })
    }
  }

  const tracked = probes.filter((p) => p.status !== 'unverified')
  const latestApplied = [...tracked]
    .filter((p) => p.status === 'applied')
    .sort((a, b) => b.id.localeCompare(a.id))
  const latestAppliedId = latestApplied[0]?.id ?? null
  const latestFile = latestApplied[0]?.file ?? null

  let status: HealthStatus = 'ok'
  if (pendingCount > 0) status = 'warning'
  if (tracked.length > 0 && appliedCount === 0) status = 'error'

  const migrationsDir = resolveMigrationsDir()

  return {
    status,
    migrationsDir,
    totalFiles: files.length,
    appliedCount,
    pendingCount,
    unverifiedCount,
    latestAppliedId,
    latestFile,
    probes: probes.filter((p) => p.status !== 'unverified'),
  }
}

export function getProcessHealth(): AdminHealthResponse['process'] {
  const mem = process.memoryUsage()
  const memoryRssMb = Math.round(mem.rss / 1024 / 1024)
  const memoryHeapUsedMb = Math.round(mem.heapUsed / 1024 / 1024)
  let status: HealthStatus = 'ok'
  if (memoryRssMb > 1024) status = 'warning'
  if (memoryRssMb > 2048) status = 'error'

  return {
    status,
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    uptimeSec: Math.round(process.uptime()),
    memoryRssMb,
    memoryHeapUsedMb,
  }
}

export async function getAdminHealth(
  pool: Pool,
  opts?: { diskPath?: string; version?: string },
): Promise<AdminHealthResponse> {
  const migrationsDir = resolveMigrationsDir()
  const files = listMigrationFiles(migrationsDir)

  const [dbPing, migration] = await Promise.all([
    pingDatabase(pool),
    runMigrationProbes(pool, files),
  ])

  const disk = getDiskHealth(opts?.diskPath)
  const process = getProcessHealth()

  return {
    time: new Date().toISOString(),
    service: 'pm-api',
    version: opts?.version ?? '0.0.0',
    db: {
      status: dbPing.status,
      latencyMs: dbPing.latencyMs,
      pool: getPoolStats(pool),
      message: dbPing.message ?? null,
    },
    disk,
    process,
    migration,
  }
}

export async function listHealthErrorLogs(
  pool: Pool,
  limit = 100,
): Promise<
  {
    id: number
    actorId: string | null
    action: string
    resource: string | null
    resourceId: string | null
    message: string | null
    createdAt: string
  }[]
> {
  const { rows } = await pool.query(
    `SELECT id, actor_id, action, resource, resource_id, message, created_at
     FROM app.tbl_audit_log
     WHERE status = 'error'
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [limit],
  )
  return rows.map((row) => ({
    id: Number(row.id),
    actorId: row.actor_id != null ? String(row.actor_id) : null,
    action: String(row.action),
    resource: row.resource != null ? String(row.resource) : null,
    resourceId: row.resource_id != null ? String(row.resource_id) : null,
    message: row.message != null ? String(row.message) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }))
}

export function formatBytes(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
